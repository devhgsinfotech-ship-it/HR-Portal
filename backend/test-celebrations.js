async function test() {
    try {
        const { getCelebrations } = require('./src/controllers/celebrationController.js');
        const req = {};
        const res = {
            json: (data) => console.log("Success:", JSON.stringify(data, null, 2)),
            status: (code) => ({
                json: (err) => console.error(`Error ${code}:`, err)
            })
        };
        await getCelebrations(req, res);
    } catch(e) {
        console.error(e);
    }
}
test();
