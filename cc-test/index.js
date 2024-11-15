var fs = require('fs');
var pdf = require('pdf-parse');
var dataBuffer = fs.readFileSync('./public/cc-menus/menu.pdf');
var weeklyMenu = [];
var weekdays = ['Mon \n', 'Tue \n', 'Wed \n', 'Thurs \n', 'Fri \n', 'Thu\nrs\n'];
var messageArr = [];
pdf(dataBuffer).then(function (data) {
    var parsedText = data.text;
    // Create a regular expression to match any of the weekdays
    var regex = new RegExp(weekdays.join('|'), 'g');
    var weeklyMenuPT = parsedText.split(regex).slice(1);
    //console.log(weeklyMenuPT);
    weeklyMenuPT.forEach(function (day, index) {
        var dayOfWeek = weekdays[index].trim();
        var dayObject = {
            name: dayOfWeek,
            plateLunch: [],
            grabAndGo: [],
            specialMessage: ''
        };
        // Regular expression to match 'Value Bowl: {VARIABLE MENU ITEM HERE}' followed by a newline
        var valueBowlRegex = /Value Bowl: .*?\n/g;
        var valueBowlMatches = day.match(valueBowlRegex);
        //console.log(`valueBowlMatches: ${valueBowlMatches}`); 
        var plateLunchOptions;
        var grabAndGoOptions;
        if (valueBowlMatches && valueBowlMatches.length > 0) {
            var startOfValue = valueBowlMatches[0];
            var valueLineLength = valueBowlMatches[0].length;
            var endOfValue = day.indexOf(startOfValue) + valueLineLength;
            //console.error((day.indexOf(startOfValue) + valueLineLength));
            plateLunchOptions = day.slice(day.indexOf('• '), endOfValue);
            plateLunchOptions = plateLunchOptions.split('• ').slice(1);
            grabAndGoOptions = day.slice(endOfValue);
            grabAndGoOptions = grabAndGoOptions.split('• ').slice(1);
        }
        else {
            plateLunchOptions = day.split('•').slice(1, 7);
            grabAndGoOptions = day.split('•').slice(7);
        }
        //console.log(plateLunchOptions);
        //console.log(grabAndGoOptions);
        var lastGGOption = grabAndGoOptions[grabAndGoOptions.length - 1];
        if (/\n\S/.test(lastGGOption)) {
            var message = lastGGOption.slice(lastGGOption.indexOf('\n') + 1);
            message = message.replace(/\n/g, '').trim();
            messageArr.push(message);
        }
        plateLunchOptions === null || plateLunchOptions === void 0 ? void 0 : plateLunchOptions.forEach(function (option) {
            var formattedOption = option.replace(/\n/g, '').trim();
            dayObject.plateLunch.push(formattedOption);
        });
        grabAndGoOptions === null || grabAndGoOptions === void 0 ? void 0 : grabAndGoOptions.forEach(function (option) {
            var formattedOption = option.replace(/\n/g, '').trim();
            dayObject.grabAndGo.push(formattedOption);
        });
        weeklyMenu.push(dayObject);
    });
    var holidays = weeklyMenu.filter(function (day) {
        return (day.plateLunch.length === 0 && day.grabAndGo.length === 0);
    });
    console.log(holidays);
    messageArr.forEach(function (message, index) {
        holidays[index].specialMessage = message;
    });
    console.log(weeklyMenu);
});