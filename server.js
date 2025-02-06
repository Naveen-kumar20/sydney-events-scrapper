const express = require('express');
const app = express();
const mongoose = require('mongoose')
const path = require('path')
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const Email = require('./models/Email');

const PORT = 8000;

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


mongoose.connect('mongodb://127.0.0.1:27017/sydney-events')
.then(() => console.log('Connected to Database'))
.catch(err => console.error('DB not connected', err));


//Scraping logic
async function scrapeEvents() {
    
    const url = 'https://www.eventbrite.com.au/d/australia--sydney/events/';
    const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
    
    const $ = cheerio.load(data);
    const events = [];

    $('.eds-g-cell').each((index, element) => {
        const image = $(element).find('section > div > a > div > img').attr('src');
        const title = $(element).find('section > div > .event-card-details > div > a > h3').text();
        const date = $(element).find('section > div > .event-card-details > div > p:nth-of-type(1)').text();
        const place = $(element).find('section > div > .event-card-details > div > p:nth-of-type(2)').text();
        // const price = $(element).find('section > div > .event-card-details > div > div:nth-child(5) > p').text();
        const link = $(element).find('section > div > a').attr('href');

        if(image && title && date && place && link){
            events.push({ image, title, date, place, link });
        }
    });

    // Save to JSON file
    fs.writeFileSync('./data/events.json', JSON.stringify(events));
}
//To see events
app.get('/', (req,res)=>{    
    const events = JSON.parse(fs.readFileSync('./data/events.json'));
    res.render('index', {events})
})

//route for get ticket button
app.post('/get-ticket', (req,res)=>{
    let {link} = req.body;
    res.render('email', {link})
    
})
// route to save email to DB and redirect to original, event page.
app.post('/submit-email', async(req,res)=>{
    try {
        let {link, emailAddress} = req.body;
        await Email.create({emailAddress});
        res.redirect(link);
    } catch (error) {
        console.error("Error saving email:", error);
        res.status(500).send("Something went wrong. Please try again later.");
    }
})



scrapeEvents(); // Initial scrape
// Scrape events every 24 hours 
setInterval(scrapeEvents, 24 * 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
