var express = require('express'),
    Path = require('path'),
    cheerio = require('cheerio'),
    $,
    fs = require('fs'),
    bookScraper = require('./scrapeBook.js'), //module, like a class
    books = [];

var routes = express.Router();

//If we were scraping outside webpages, an npm module called 'axios'
//could be used to fetch the webpage's html. It is a promise based http tool for node

//I made a function readBook, which is called recursively, because I am using 'fs' to read the html files
//and the fs.readFile function is asynchronous. An alternative would be using the synchronous version of 'fs.readFile'
//inside of a simple 'for' loop or 'while' loop. This would be less 'expensive', in terms of not building
//up the call stack, but would hold up the rest of the program
function readBook(bookNum){

  fs.readFile('./data/book' + bookNum + '.html', 'utf8', function(err, data){
    var isbn_shipping, bookDeets = {};

    if(err) throw err;

    $ = loadPage(data);

    bookDeets["title"] = bookScraper.getTitle($);
    bookDeets["author"] = bookScraper.getAuthor($);
    bookDeets["price"] = bookScraper.getPrice($);

    //needed a variable here because bookScraper.getISBNandShipping returns an object with two details
    isbn_shipping = bookScraper.getISBNandShipping($);
    bookDeets["shipping_weight"] = isbn_shipping.shipping_weight;
    bookDeets["isbn-10"] = isbn_shipping.isbn;


    books.push(bookDeets);

    if(bookNum < 20){
      bookNum++;
      readBook(bookNum);
    }

  });
}

readBook(1);

function loadPage (webpage) {
  return cheerio.load(webpage);
}



var assetFolder = Path.resolve(__dirname, '../client');
routes.use(express.static(assetFolder));

routes.get('/getBooks', function(req, res){
  res.status(200).send(books);
});

//The catch all route to serve files like bootstrap
routes.get('/*', function(req, res){
  req.url = '..' + req.url;
  res.sendFile(Path.resolve(__dirname, req.url ));
});

if (process.env.NODE_ENV !== 'test') {

  // We're in development or production mode;
  // create and run a real server.
  var app = express()

  // Mount our main router
  app.use('/', routes)

  var port = process.env.PORT || 4400
  app.listen(port)
  console.log("Listening on port", port)

} else {
  // We're in test mode; make this file importable instead.
  module.exports = routes
}
