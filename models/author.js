const { DateTime } = require('luxon');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema(
    {
        first_name: {
            type: String,
            required: true,
            maxLength: 100
        },
        family_name: {
            type: String,
            required: true,
            maxLength: 100
        },
        date_of_birth: {
            type: Date
        },
        date_of_death: {
            type: Date
        }
    }
);

// Virtual for author's full name
AuthorSchema
    .virtual('name')
    .get(function() {
        let fullname = '';
        if (this.first_name && this.family_name) {
            fullname = `${this.family_name}, ${this.first_name}`;
        }
        if (!this.first_name || !this.family_name) {
            fullname = '';
        }
        return fullname;
    })

// Virtuals for formatted date of birth and date of death
AuthorSchema
    .virtual('date_of_birth_formatted')
    .get(function() {
         return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : '';
    });

AuthorSchema
    .virtual('date_of_death_formatted')
    .get(function() {
        return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
    });

// Virtual for author's URL

AuthorSchema
    .virtual('url')
    // No arrow function because we need the this object
    .get(function() {
        return `/catalog/author/${this._id}`;
    });

// Virtuals for date inputs formatted to yyyy-mm-dd using luxon
AuthorSchema
    .virtual('dob_input_format')
    // No arrow function because we need the this object
    .get(function() {
        return DateTime.fromJSDate(this.date_of_birth).toFormat('yyyy-LL-dd')
    });

AuthorSchema
    .virtual('dod_input_format')
    // No arrow function because we need the this object
    .get(function() {
        return DateTime.fromJSDate(this.date_of_death).toFormat('yyyy-LL-dd')
    });


    

module.exports = mongoose.model('Author', AuthorSchema);
