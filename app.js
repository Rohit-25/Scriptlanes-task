const express = require("express");
const app = express();
const axios = require('axios');
const fs = require('fs')
app.use(express.json());

app.post("/getHospitals", async (req, res) => {
    let { district_id, date, limit } = req.body;


    // validation for district id and date as mandatory fields
    if (!district_id || !date) {
        return res.status(400).json({ error: "District id or Date is missing" });
    }

    //validation for district_id, date and limit
    if (!Number.isInteger(district_id) || district_id <= 0 || typeof date !== "string" || limit <= 0) {
        return res.status(400).json({ error: "Please send valid data" });
    }

    limit = limit || 10; // setting default limit if no val is pass

    // Date validation 
    const dateParts = date.split('-');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // make month as 0 based indexing
    const year = parseInt(dateParts[2], 10);

    // Create Date objects for the provided date and today's date
    const providedDate = new Date(year, month, day);
    const today = new Date();
    providedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (providedDate < today) {
        return res.status(400).json({ error: 'Cannot enter past dates' });
    }

    try {
        // fetch hospital data from api 
        const response = await axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${date}`);

        //limiting data to provided limit
        const data = response.data.centers.slice(0, limit)

        //creating output in required fromat
        const result = data.map((center) => {
            return {
                name: center.name,
                sessions: center.sessions.map((session) => {
                    return {
                        available_capacity: session.available_capacity,
                        vaccine: session.vaccine,
                    };
                }),
            };
        });

        const dataString = JSON.stringify(result, null, 2); // The '2' argument adds indentation for readability

        // Specify the file path
        const filePath = 'hospital.txt';

        // Write the data to the file, overwriting it each time
        fs.writeFileSync(filePath, dataString);

        res.status(200).json({ message: 'Hospitals sent successfully', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});
