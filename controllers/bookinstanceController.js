const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');
const { DateTime } = require('luxon')

const async = require('async')
 
// Display list of all BookInstances
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec(function(err, list_bookinstance) {
            if (err) { return next(err) }
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstance });
        });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = (req, res) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if (err) { return next(err) }
            if (bookinstance == null) {
                const err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_detail', {
                title: `Copy: ${bookinstance.book.title}`,
                bookinstance
            })
        })
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, "title").exec((err, books) => {
      if (err) {
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: books,
      });
    });
  };

// Handle BookInstance create on POST
exports.bookinstance_create_post = [
    // Validate and sanitize fields.
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
      .optional({ checkFalsy: true })
      .isISO8601()
      .toDate(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a BookInstance object with escaped and trimmed data.
      const bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      });
  
      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values and error messages.
        Book.find({}, "title").exec(function (err, books) {
          if (err) {
            return next(err);
          }
          // Successful, so render.
          res.render("bookinstance_form", {
            title: "Create BookInstance",
            book_list: books,
            selected_book: bookinstance.book._id,
            errors: errors.array(),
            bookinstance,
            due_back: DateTime.fromJSDate(bookinstance.due_back).toFormat('yyyy-LL-dd')
          });
        });
        return;
      }
  
      // Data from form is valid.
      bookinstance.save((err) => {
        if (err) {
          return next(err);
        }
        // Successful: redirect to new record.
        res.redirect(bookinstance.url);
      });
    },
  ];

// Display bookinstance delete form on GET
exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id).populate('book').exec((err, bookinstance) => {
        if (err) { return next(err) };
        if (bookinstance == null) {
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', {
            title: 'Delete Book Instance',
            bookinstance
        });
    });
};

// Handle bookinstance delete on POST
exports.bookinstance_delete_post = (req, res, next) => {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err, bookinstance) => {
        if (err) { return next(err) };
        console.log('Deleted: ', bookinstance);
        res.redirect('/catalog/bookinstances');
    })
};

// Display bookinstnace update form on GET
exports.bookinstance_update_get = (req, res, next) => {
    async.parallel(
        {
            bookinstance(callback) {
                BookInstance.findById(req.params.id)
                    .populate('book')
                    .exec(callback);
            },
            books(callback) {
                Book.find(callback)
            }
        },
        (err, results) => {
            if (err) { return next(err) };
            res.render('bookinstance_form', {
                title: 'Update BookInstance',
                bookinstance: results.bookinstance,
                book_list: results.books,
                selected_book: results.bookinstance.book._id,
                due_back: DateTime.fromJSDate(results.bookinstance.due_back).toFormat('yyyy-LL-dd')
            })
        }
    )
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = [
    body('book', 'Book must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('imprint', 'Imprint must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('due_back')
        .optional({checkFalsy: true})
        .isISO8601()
        .toDate(),
    body('status')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title', (err, books) => {
                if (err) { return next(err) };
                res.render('bookinstance_form', {
                    title: 'Update BookInstance',
                    bookinstance,
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    due_back: DateTime.fromJSDate(bookinstance.due_back).toFormat('yyyy-LL-dd')
                })
            })
            return;
        }

        BookInstance.findByIdAndUpdate(req.params.id, bookinstance, (err, updatedBookInstance) => {
            if (err) { return next(err) };
            res.redirect(updatedBookInstance.url);
        })
    }
];