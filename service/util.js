const padTo2Digits = (num) => {
    return num.toString().padStart(2, '0');
}
  
const formatDate = (date) => {
    return (
      [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('-') +
      ' ' +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
      ].join(':')
    );
}

const calcTimeInterval = (time) => {
  let timeInterval = (new Date().getTime() - time) / 1000;
  let unit = '';
  if (timeInterval > 3600 * 24 * 365) {
    timeInterval = Math.floor(timeInterval / (3600 * 24 * 365));
    unit = timeInterval > 1 ? 'years' : 'year';
  }
  if (timeInterval > 3600 * 24 * 30) {
    timeInterval = Math.floor(timeInterval / (3600 * 24 * 30));
    unit = timeInterval > 1 ? 'months' : 'month';
  } else if (timeInterval > 3600 * 24) {
    timeInterval = Math.floor(timeInterval / (3600 * 24));
    unit = timeInterval > 1 ? 'days' : 'day';
  } else if (timeInterval > 3600) {
    timeInterval = Math.floor(timeInterval / 3600);
    unit = timeInterval > 1 ? 'hours' : 'hour';
  } else if (timeInterval > 60) {
    timeInterval = Math.floor(timeInterval / 60);
    unit = timeInterval > 1 ? 'minutes' : 'minute';
  } else if (timeInterval > 1) {
    timeInterval = Math.floor(timeInterval);
    unit = timeInterval > 1 ? 'seconds' : 'second';
  } else {
    timeInterval = 1;
    unit = 'second';
  }
  return {
    "timeInterval": timeInterval,
    "unit": unit
  };
}

module.exports = { formatDate, calcTimeInterval };