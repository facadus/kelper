/**
 * Module dependencies.
 */

var Base = require('./base');

/**
 * Expose `kelper-reporter`.
 */

exports = module.exports = kelperReporter;

/**
 * Initialize a new `kelper-reporter` reporter.
 *
 * @api public
 */

function kelperReporter(runner) {
    Base.call(this, runner);

    var stats = this.stats;
    var total = runner.total;
    var current = {};
    var oldConsole = console;

    runner.on('start', function () {
        current = {
            file: document.location.href,
            total: total,
            errors: []
        };

        if (console) {
            console['log'] = function () {};
            console['warn'] = function () {};
            console['info'] = function () {};
            console['error'] = function () {};
        }
    });

    runner.on('fail', function (test, err) {
        current['errors'].push({
            'title': test.title,
            'fullTitle': test.fullTitle(),
            'duration': test.duration,
            'message': err.message
        });
    });

    runner.on('end', function () {
        if (current['errors'] && current['errors'].length > 0) {
            process.stdout.write(' >> File `' + current.file + '` has ' + current['errors'].length + ' errors of ' + current.total + ' tests: \n');
            current['errors'].forEach(function (error, index) {
                process.stdout.write((index + 1) + ') ' + error.fullTitle + ' (' + error.duration + 'ms) - ' + error.message + '\n');
            });
        } else {
            process.stdout.write(' >> File `' + current.file + '` has passed ' + current.total + ' tests \n');
        }

        console = oldConsole;
    });
}