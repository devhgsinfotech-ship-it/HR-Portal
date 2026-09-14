// backend/src/config/prisma.js
// Resilient Prisma Client wrapper with automatic recovery from Hostinger/Passenger thread panics

const { PrismaClient } = require('@prisma/client');

let prismaInstance = new PrismaClient();

function resetPrismaClient() {
    try {
        prismaInstance.$disconnect().catch(() => {});
    } catch (e) {}
    prismaInstance = new PrismaClient();
    return prismaInstance;
}

const prismaProxy = new Proxy({}, {
    get(_target, prop) {
        const currentValue = prismaInstance[prop];

        if (typeof currentValue === 'function') {
            return async function (...args) {
                try {
                    return await currentValue.apply(prismaInstance, args);
                } catch (err) {
                    if (err && err.message && (err.message.includes('timer has gone away') || err.message.includes('PANIC') || err.message.includes('Query Engine'))) {
                        console.warn(`Prisma engine panic on '${String(prop)}'. Re-initializing client...`);
                        resetPrismaClient();
                        return await prismaInstance[prop].apply(prismaInstance, args);
                    }
                    throw err;
                }
            };
        }

        if (typeof currentValue === 'object' && currentValue !== null) {
            return new Proxy(currentValue, {
                get(modelTarget, modelProp) {
                    const method = modelTarget[modelProp];
                    if (typeof method === 'function') {
                        return async function (...args) {
                            try {
                                return await method.apply(modelTarget, args);
                            } catch (err) {
                                if (err && err.message && (err.message.includes('timer has gone away') || err.message.includes('PANIC') || err.message.includes('Query Engine'))) {
                                    console.warn(`Prisma engine panic on '${String(prop)}.${String(modelProp)}'. Re-initializing client...`);
                                    resetPrismaClient();
                                    const freshModel = prismaInstance[prop];
                                    return await freshModel[modelProp].apply(freshModel, args);
                                }
                                throw err;
                            }
                        };
                    }
                    return method;
                }
            });
        }

        return currentValue;
    }
});

module.exports = prismaProxy;
