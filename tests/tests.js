import { configs } from "../config/config.js";
import { app } from "../app.js";
import { superoak, assertEquals } from "../deps.js"
import * as healthService from "../services/healthService.js"
import * as healthApi from "../routes/apis/healthApi.js"
import * as healthController from "../routes/controllers/healthController.js"
import { executeQuery } from "../database/database.js"

const users = configs.userDBname;
const morning = configs.morningDBname;
const evening = configs.eveningDBname;

const clearTables = async(reports, user) => {
    if(reports){
        await executeQuery(`DELETE FROM ${morning};`);
        await executeQuery(`DELETE FROM ${evening};`);
    }
    if(user){
        await executeQuery(`DELETE FROM ${users};`)
    }
    console.log("Database tables cleared.")
}

Deno.test({
    name: "Registration should not succeed with different password in verification-field", 
    async fn() {
        await clearTables(true, true);
        const countBefore = await executeQuery(`SELECT COUNT(id) as count FROM ${users};`);
        const testClient = await superoak(app);
        await testClient.post("/auth/registration").send('email=test@test&password=test&verification=notTest');
        const countAfter = await executeQuery(`SELECT COUNT(id) as count FROM ${users};`);
        assertEquals(countAfter.rowsOfObjects()[0].count, 
                    countBefore.rowsOfObjects()[0].count)
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "Registration should succeed and increase count of users in database", 
    async fn() {
        await clearTables(true, true);
        const countBefore = await executeQuery(`SELECT COUNT(id) as count FROM ${users};`);
        const testClient = await superoak(app);
        await testClient.post("/auth/registration").send('email=test@test&password=test&verification=test');
        const countAfter = await executeQuery(`SELECT COUNT(id) as count FROM ${users};`);
        assertEquals(Number(countAfter.rowsOfObjects()[0].count), 
                    Number(countBefore.rowsOfObjects()[0].count + 1))
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "It should not be possible to log in with incorrect credentials", 
    async fn() {
        assertEquals(await healthService.authenticate("test@test", "notTest", { set: ()=>'', }), [false, [["Invalid email or password"]]]);
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "It should be possible to log in using the correct credentials", 
    async fn() {
        assertEquals(await healthService.authenticate("test@test", "test", { set: ()=>'', }), [true, [['Authentication successful!']]]);
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "Adding a morning report should increase the count of reports in the database", 
    async fn() {
        await clearTables(true, false);
        const countBefore = await executeQuery(`SELECT COUNT(id) as count FROM ${morning};`);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addMorning('2020-12-10', 9, 4, 3, id);
        const countAfter = await executeQuery(`SELECT COUNT(id) as count FROM ${morning};`);
        assertEquals(Number(countAfter.rowsOfObjects()[0].count), 
                    Number(countBefore.rowsOfObjects()[0].count + 1))
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "Previously added morning report should be found in the database", 
    async fn() {
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        const res = await healthService.checkMorning('2020-12-10', id);
        assertEquals([Number(res[0].sleep_duration), Number(res[0].sleep_quality), Number(res[0].mood)], 
                    [9, 4, 3])
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "Updating the previously added morning report should should change the values", 
    async fn() {
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.updateMorning('2020-12-10', 3, 1, 5, id)
        const res = await healthService.checkMorning('2020-12-10', id);
        assertEquals([Number(res[0].sleep_duration), Number(res[0].sleep_quality), Number(res[0].mood)], 
                    [3, 1, 5])
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "Adding an evening report should increase the count of reports in the database", 
    async fn() {
        await clearTables(true, false);
        const countBefore = await executeQuery(`SELECT COUNT(id) as count FROM ${evening};`);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addEvening('2020-12-10', 0, 4, 4, 3, id);
        const countAfter = await executeQuery(`SELECT COUNT(id) as count FROM ${evening};`);
        assertEquals(Number(countAfter.rowsOfObjects()[0].count), 
                    Number(countBefore.rowsOfObjects()[0].count + 1))
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "Previously added evening report should be found in the database", 
    async fn() {
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        const res = await healthService.checkEvening('2020-12-10', id);
        assertEquals([Number(res[0].sport_time), Number(res[0].study_time), Number(res[0].eating), Number(res[0].mood)], 
                    [0, 4, 4, 3])
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "Updating the previously added evening report should should change the values", 
    async fn() {
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.updateEvening('2020-12-10', 2, 3, 3, 4, id)
        const res = await healthService.checkEvening('2020-12-10', id);
        assertEquals([Number(res[0].sport_time), Number(res[0].study_time), Number(res[0].eating), Number(res[0].mood)], 
                    [2, 3, 3, 4])
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "weekSummary should calculate averages correctly after adding a morning and evening report", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addMorning('2020-12-10', 9, 4, 3, id);
        await healthService.addEvening('2020-12-09', 2, 10, 3, 5, id);
        assertEquals(await healthService.weekSummary(50, id), 
        {
            eating: "3.00",
            mood: "4.00",
            sleep_duration: "9.00",
            sleep_quality: "4.00",
            sport_time: "2.00",
            study_time: "10.00",
            successful: true,
        })
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "weekSummary should calculate averages correctly after adding two of each: morning and evening report", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addMorning('2020-12-10', 9, 4, 3, id);
        await healthService.addMorning('2020-12-07', 7, 3, 1, id);
        await healthService.addEvening('2020-12-13', 2, 10, 3, 5, id);
        await healthService.addEvening('2020-12-12', 0, 0, 2, 1, id);
        assertEquals(await healthService.weekSummary(50, id), 
        {
            eating: "2.50",
            mood: "2.50",
            sleep_duration: "8.00",
            sleep_quality: "3.50",
            sport_time: "1.00",
            study_time: "5.00",
            successful: true,
        })
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "weekSummary should ignore reports outside of chosen week", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addMorning('2020-12-10', 9, 4, 3, id);
        await healthService.addMorning('2020-12-11', 7, 3, 1, id);
        await healthService.addMorning('2020-12-16', 10, 3, 3, id);
        await healthService.addEvening('2020-12-09', 2, 10, 3, 5, id);
        await healthService.addEvening('2020-12-08', 0, 0, 2, 1, id);
        await healthService.addEvening('2020-12-01', 6, 9, 2, 5, id);
        assertEquals(await healthService.weekSummary(50, id), 
        {
            eating: "2.50",
            mood: "2.50",
            sleep_duration: "8.00",
            sleep_quality: "3.50",
            sport_time: "1.00",
            study_time: "5.00",
            successful: true,
        })
    },
    sanitizeResources: false,
    sanitizeOps: false
});


Deno.test({
    name: "monthSummary should calculate averages correctly from multiple reports", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addMorning('2020-12-10', 9, 4, 3, id);
        await healthService.addMorning('2020-12-11', 7, 3, 1, id);
        await healthService.addMorning('2020-12-16', 10, 3, 3, id);
        await healthService.addEvening('2020-12-09', 2, 10, 3, 5, id);
        await healthService.addEvening('2020-12-08', 0, 0, 2, 1, id);
        await healthService.addEvening('2020-12-01', 6, 9, 2, 5, id);
        assertEquals(await healthService.monthSummary(12, id), 
        {
            eating: "2.33", 
            mood: "3.00",
            sleep_duration: "8.67",
            sleep_quality: "3.33",
            sport_time: "2.67",
            study_time: "6.33",
            successful: true,
        })
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "reportsComplete should return the correct message when both reports are done", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addMorning('2020-12-10', 10, 3, 3, id);
        await healthService.addEvening('2020-12-10', 2, 10, 3, 5, id);
        assertEquals(await healthService.reportsComplete('2020-12-10', id), "You have completed both reports for today.");
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "reportsComplete should return the correct message when only one of the reports is complete", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        await healthService.addMorning('2020-12-10', 10, 3, 3, id);
        assertEquals(await healthService.reportsComplete('2020-12-10', id), "You have completed the morning report for today.");

        await clearTables(true, false);
        await healthService.addEvening('2020-12-10', 2, 10, 3, 5, id);
        assertEquals(await healthService.reportsComplete('2020-12-10', id), "You have completed the evening report for today.");
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "reportsComplete should return the correct message when no reports are complete", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users} LIMIT 1;`);
        const id = user.rowsOfObjects()[0].id;
        assertEquals(await healthService.reportsComplete('2020-12-10', id), "You haven't completed either report for today.");
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "overallMood should correcly calculate the average of all users", 
    async fn() {
        await clearTables(true, false);
        const testClient = await superoak(app);
        await testClient.post("/auth/registration").send('email=yeet@yeet&password=yeet&verification=yeet')
        const user = await executeQuery(`SELECT id FROM ${users};`);
        const id1 = user.rowsOfObjects()[0].id;
        const id2 = user.rowsOfObjects()[1].id;
        await healthService.addMorning('2020-12-10', 10, 3, 3, id1);
        await healthService.addMorning('2020-12-10', 5, 1, 5, id2);
        await healthService.addEvening('2020-12-10', 5, 2, 4, 4, id1);
        await healthService.addEvening('2020-12-10', 2, 10, 3, 5, id2);
        assertEquals(await healthService.overallMood('2020-12-10'), "4.25");
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "weekSummary should calculate data correctly at /api/summary", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users};`);
        const id1 = user.rowsOfObjects()[0].id;
        const id2 = user.rowsOfObjects()[1].id;
        const date = new Date().toISOString().substr(0, 10);
        const anotherDate = new Date();
        anotherDate.setDate(anotherDate.getDate() - 1);
        await healthService.addMorning(date, 10, 3, 3, id1);
        await healthService.addMorning(date, 5, 1, 5, id2);
        await healthService.addEvening(anotherDate, 5, 2, 4, 4, id1);
        await healthService.addEvening(anotherDate, 2, 10, 3, 5, id2);
        const response = {body: {}}
        await healthApi.weekSummary({response: response})
        assertEquals(response, {
            body: {
            mood: "4.25",
            sleep_duration: "7.50",
            sleep_quality: "2.00",
            sport_time: "3.50",
            study_time: "6.00",
            },
        })
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "daySummary should calculate data correctly at /api/summary/:year/:month/:day", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users};`);
        const id1 = user.rowsOfObjects()[0].id;
        const id2 = user.rowsOfObjects()[1].id;
        await healthService.addMorning('2020-12-10', 10, 3, 3, id1);
        await healthService.addMorning('2020-12-10', 5, 1, 5, id2);
        await healthService.addEvening('2020-12-10', 5, 2, 4, 4, id1);
        await healthService.addEvening('2020-12-10', 2, 10, 3, 5, id2);
        const response = {body: {}}
        await healthApi.weekSummary({params: {year:'2020', month:'12', day:'10'}, response: response})
        assertEquals(response, {
            body: {
            mood: "4.25",
            sleep_duration: "7.50",
            sleep_quality: "2.00",
            sport_time: "3.50",
            study_time: "6.00",
            },
        })
    },
    sanitizeResources: false,
    sanitizeOps: false
});

Deno.test({
    name: "daySummary should ignore data outside of chosen day", 
    async fn() {
        await clearTables(true, false);
        const user = await executeQuery(`SELECT id FROM ${users};`);
        const id1 = user.rowsOfObjects()[0].id;
        const id2 = user.rowsOfObjects()[1].id;
        await healthService.addMorning('2020-12-10', 10, 3, 3, id1);
        await healthService.addMorning('2020-12-09', 5, 1, 5, id2);
        await healthService.addMorning('2020-12-08', 10, 2, 4, id1);
        await healthService.addMorning('2020-12-07', 1, 2, 3, id2);
        await healthService.addEvening('2020-12-10', 5, 2, 4, 4, id1);
        await healthService.addEvening('2020-12-11', 2, 10, 3, 5, id2);
        await healthService.addEvening('2020-12-12', 5, 1, 2, 2, id1);
        await healthService.addEvening('2020-12-13', 2, 3, 3, 3, id2);
        const response = {body: {}}
        await healthApi.weekSummary({params: {year:'2020', month:'12', day:'10'}, response: response})
        assertEquals(response, {
            body: {
            mood: "4.13",
            sleep_duration: "6.50",
            sleep_quality: "2.00",
            sport_time: "3.50",
            study_time: "6.00",
            },
        })
    },
    sanitizeResources: false,
    sanitizeOps: false
});