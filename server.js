const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

app.use(express.static(__dirname));

const uri = "mongodb+srv://chirag:12345@cluster0.waacz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

function formatDateTime(isoDate) {
    const date = new Date(isoDate);

    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    // Extract date components
    const day = adjustedDate.getDate().toString().padStart(2, '0');
    const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = adjustedDate.getFullYear();

    // Extract time components
    const hours = adjustedDate.getHours().toString().padStart(2, '0');
    const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
    const seconds = adjustedDate.getSeconds().toString().padStart(2, '0');

    // Return formatted string
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}
// Get latest values
app.get('/api/emissions/latest', async (req, res) => {
    try {
        await client.connect();
        const collection = client.db('gassy').collection('gassy');

        const latestRecord = await collection
            .find({})
            .sort({ Date: -1 })
            .limit(1)
            .toArray();

        if (latestRecord.length > 0) {
            // Get the date string from MongoDB
            const dateStr = latestRecord[0].Date;

            res.json({
                latestTime: formatDateTime(dateStr), // Original date string in dd-mm-yyyy HH:MM:SS format
                latestEmission: latestRecord[0].CO_Emissions_ppm,
                CO2: latestRecord[0].CO2_Emission_PPM,
                Temperature: latestRecord[0].temperature_C,
                Humidity: latestRecord[0].humidity
            });
        } else {
            res.status(404).json({ error: 'No data found' });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch latest data' });
    }
});

// Get daily averages
app.get('/api/emissions/daily-averages', async (req, res) => {
    try {
        await client.connect();
        const collection = client.db('gassy').collection('gassy');

        // Aggregate pipeline for daily averages
        const dailyAverages = await collection.aggregate([{
            $group: {
                _id: {
                    $substr: ['$Date', 0, 10] // Group by date part only
                },
                average: {
                    $avg: { $toDouble: '$CO_Emissions_ppm' }
                },
                average_co2: {
                    $avg: { $toDouble: '$CO2_Emission_PPM' }
                },
                max_co2: {
                    $max: { $toDouble: '$CO2_Emission_PPM' }
                },
                min_co2: {
                    $min: { $toDouble: '$CO2_Emission_PPM' }
                },
                max_co: {
                    $max: { $toDouble: '$CO_Emissions_ppm' }
                },
                min_co: {
                    $min: { $toDouble: '$CO_Emissions_ppm' }
                }
            }
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                average: { $round: ['$average', 2] },
                average_co2: { $round: ['$average_co2', 2] },
                min_co: { $round: ['$min_co', 2] },
                min_co2: { $round: ['$min_co2', 2] },
                max_co: { $round: ['$max_co', 2] },
                max_co2: { $round: ['$max_co2', 2] }
            }
        },
        {
            $sort: { date: 1 }
        }
        ]).toArray();

        res.json(dailyAverages);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch daily averages' });
    }
});

app.get('/api/emissions/15min', async (req, res) => {
    try {
        await client.connect();
        const collection = client.db('gassy').collection('gassy');

        // Find the most recent record's timestamp
        const latestRecord = await collection.find().sort({ Date: -1 }).limit(1).toArray();
        if (latestRecord.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const latestTime = latestRecord[0].Date;

        // Calculate time 15 minutes before the latest time
        const fifteenMinutesAgo = new Date(latestTime);
        fifteenMinutesAgo.setMinutes(latestTime.getMinutes() - 15);

        // Fetch data from the last 15 minutes
        const last15MinData = await collection
            .find({ Date: { $gte: fifteenMinutesAgo, $lte: latestTime } })
            .sort({ Date: 1 })
            .toArray();

        // Format data to send to the front end
        const responseData = last15MinData.map(record => ({
            time: record.Date,
            emission: record.CO_Emissions_ppm
        }));
        res.json({ last15MinData: responseData });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch last 15 minutes of data' });
    }
});
app.get('/api/emissions/15minco2', async (req, res) => {
    try {
        await client.connect();
        const collection = client.db('gassy').collection('gassy');

        // Find the most recent record's timestamp
        const latestRecord = await collection.find({}).sort({ Date: -1 }).limit(1).toArray();
        if (latestRecord.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const latestTime = latestRecord[0].Date;

        // Calculate time 15 minutes before the latest time
        const fifteenMinutesAgo = new Date(latestTime);
        fifteenMinutesAgo.setMinutes(latestTime.getMinutes() - 15);

        // Fetch data from the last 15 minutes
        const last15MinData = await collection
            .find({ Date: { $gte: fifteenMinutesAgo, $lte: latestTime } })
            .sort({ Date: 1 })
            .toArray();

        // Format data to send to the front end
        const responseData = last15MinData.map(record => ({
            time: record.Date,
            emission: record.CO2_Emission_PPM
        }));
        res.json({ last15MinData: responseData });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch last 15 minutes of data' });
    }
});

app.get('/api/emissions/pi', async (req, res) => {
    try {
        await client.connect();
        const collection = client.db('gassy').collection('gassy');

        const pipeline = [
            {
                $project: {
                    _id: 0,
                    CO_Emissions_ppm: { $round: ['$CO_Emissions_ppm', 2] }
                }
            }
        ];

        const responseData = await collection.aggregate(pipeline).toArray();
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve data' });
    } finally {
        await client.close();
    }
});
app.get('/api/emissions/session', async (req, res) => {
    try {
        await client.connect();
        const collection = client.db('gassy').collection('gassy');

        const pipeline = [
            {
                $project: {
                    _id: 0,
                    time: ['$Date'],
                    CO: { $round: ['$CO_Emissions_ppm', 2] },
                    CO2: { $round: ['$CO2_Emission_PPM', 2] }
                }
            }
        ];

        const responseData = await collection.aggregate(pipeline).toArray();
        const rawData = responseData.sort((a, b) => new Date(a.time) - new Date(b.time));
        res.json(rawData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve data' });
    } finally {
        await client.close();
    }
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});
