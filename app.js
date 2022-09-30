// Reddit wrappers, Url recognition, filestreams, mailing, and Env var parsing.
require('dotenv').config();
const Snoowrap = require('snoowrap');
const {SubmissionStream} = require('snoostorm');
const urlFinder = require('autolinker');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const Oauth2 = google.auth.OAuth2;
const fs = require('fs');
let currentCurrentBotTime = -1;

const OAuth2Client = new Oauth2
(
    process.env.AUTH_ID,
    process.env.AUTH_SECRET,
    "https://developers.google.com/oauthplayground"
);

OAuth2Client.setCredentials
({
    refresh_token: process.env.REFRESH_TOKEN
});

const transporter = nodemailer.createTransport
({
    service: "gmail",
    auth:
    {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.AUTH_ID,
        clientSecret: process.env.AUTH_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: OAuth2Client.getAccessToken(),
        tls: {rejectUnauthorized: false}
    }
});

const mailOptions =
    {
        text: '',
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: 'Target Success'
        // Uncomment the line below to get posts written as logs as an attachment...
        // attachments: {filename: 'data.txt', path: 'data.txt'}
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
        let postMediaRaw = urlFinder.parse(urlFinder.link(post.selftext).replace
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

