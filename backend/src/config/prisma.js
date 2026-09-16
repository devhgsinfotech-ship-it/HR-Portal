// backend/src/config/prisma.js
// Prisma 5.x — uses library engine with keepalive ping to prevent
// Hostinger Passenger from suspending the Tokio timer thread.

const { PrismaClient } = require('@prisma/client');

let prisma = new PrismaClient();
let keepaliveTimer = null;

// Ping DB every 30 seconds to keep the Prisma Rust engine timer alive.
// Hostinger Passenger suspends idle processes, destroying Tokio timers.
function startKeepalive() {
    if (keepaliveTimer) return;
    keepaliveTimer = setInterval(async () => {
        try {
            await prisma.user.findFirst({ select: { id: true } });
        } catch (err) {
            // If panic happens on keepalive, recreate client
            if (err.message && (err.message.includes('timer has gone away') || err.message.includes('PANIC'))) {
                console.warn('[Prisma] Timer panic detected. Recreating client...');
                await recreatePrisma();
            }
        }
    }, 30000); // every 30 seconds
    keepaliveTimer.unref(); // don't block process exit
}

async function recreatePrisma() {
    try {
        clearInterval(keepaliveTimer);
        keepaliveTimer = null;
        await prisma.$disconnect();
    } catch (_) {}
    prisma = new PrismaClient();
    startKeepalive();
}

// Start keepalive on load
startKeepalive();

// Export a proxy that auto-recovers on Tokio panic
const handler = {
    get(target, prop) {
        const value = prisma[prop];
        if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;

        if (typeof value === 'object' && value !== null && prop !== '_') {
            return new Proxy(value, {
                get(modelTarget, modelProp) {
                    const fn = prisma[prop][modelProp];
                    if (typeof fn !== 'function') return fn;
                    return async function (...args) {
                        try {
                            return await fn.apply(prisma[prop], args);
                        } catch (err) {
                            if (err.message && (err.message.includes('timer has gone away') || err.message.includes('PANIC'))) {
                                console.warn(`[Prisma] Panic on ${prop}.${modelProp}. Recovering...`);
                                await recreatePrisma();
                                return await prisma[prop][modelProp].apply(prisma[prop], args);
                            }
                            throw err;
                        }
                    };
                }
            });
        }

        if (typeof value === 'function') {
            return async function (...args) {
                try {
                    return await value.apply(prisma, args);
                } catch (err) {
                    if (err.message && (err.message.includes('timer has gone away') || err.message.includes('PANIC'))) {
                        console.warn(`[Prisma] Panic on ${prop}. Recovering...`);
                        await recreatePrisma();
                        return await prisma[prop].apply(prisma, args);
                    }
                    throw err;
                }
            };
        }

        return value;
    }
};

module.exports = new Proxy({}, handler);
