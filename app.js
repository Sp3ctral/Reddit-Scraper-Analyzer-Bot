// Reddit wrappers, Url recognition, filestreams, mailing, and Env var parsing.
const Snoowrap = require('snoowrap');
const {SubmissionStream} = require('snoostorm');
const Autolinker = require('autolinker');
const nodemailer = require('nodemailer');
let fs = require('fs');
require('dotenv').config();
let currentCurrentBotTime = -1;

const transporter = nodemailer.createTransport(
    {
        service: 'gmail',
        auth: {user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_PASS}
    });

const mailOptions =
    {
        text: '',
        from: process.env.GMAIL_EMAIL,
        to: process.env.GMAIL_EMAIL,
        subject: 'Target',
        attachments: {filename: 'data.txt', path: 'data.txt'}
    };

// Create a new client and authenticate it.
const client = new Snoowrap(
    {
        userAgent: 'Spectral Bot',
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        username: process.env.REDDIT_USER,
        password: process.env.REDDIT_PASS,
    });

// Creates post stream. This queries the subreddit for a new post ever 2 seconds.
const stream = new SubmissionStream(client, {limit: 80, subreddit: 'r4r', pollTime: 2000});

fs.writeFile('log.txt', (Math.ceil(Date.now() / 1000)).toString(),
        err => {if (err) throw err});

fs.readFile('log.txt', function(error, content)
{
    currentCurrentBotTime = parseInt(content.toString());
})

stream.on('item', function(post)
{
    if (post.title.toUpperCase().indexOf('F4M') !== -1 && post.created_utc <
        currentCurrentBotTime)
    {
        let postUrl = post.url;
        let postMediaRaw = Autolinker.parse(Autolinker.link(post.selftext).replace
        (/[()<>_"']/g, ' '), {urls: true})[0];
        let postMediaLink = postMediaRaw === undefined ? 'NONE' : postMediaRaw.getMatchedText();

        if (postMediaLink === 'NONE')
        {
            let urlData = '\nPost link: ' + postUrl +
                '\nPost Media: ' + postMediaLink + '\n';

            console.log(urlData);

            // Uncomment the below line to write the submissions to a file...
            // fs.appendFile('data.txt', urlData, (err => {if (err) throw err}));

            // Send an email with a link to the submission that matches the filter.
            mailOptions.text = urlData;
            transporter.sendMail(mailOptions, err => {if (err) throw err});
        }
    }
});

