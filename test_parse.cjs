const { isWithinInterval, startOfDay, endOfDay } = require('date-fns');

const parseOrderDate = (order) => {
  if (order.createdAt && typeof order.createdAt.toDate === 'function') {
    return order.createdAt.toDate();
  }
  if (order.date) {
    const [datePart, timePart] = order.date.split(' ');
    if (datePart && timePart) {
      const [d, m, y] = datePart.split('/');
      const [h, min] = timePart.split(':');
      return new Date(parseInt(y), parseInt(m)-1, parseInt(d), parseInt(h), parseInt(min));
    }
  }
  return new Date();
};

const now = new Date();
const order1 = { date: "06/09/2026 11:38" };
const d1 = parseOrderDate(order1);
console.log("Parsed d1:", d1);
console.log("Interval:", { start: startOfDay(now), end: endOfDay(now) });
console.log("isWithin:", isWithinInterval(d1, { start: startOfDay(now), end: endOfDay(now) }));

