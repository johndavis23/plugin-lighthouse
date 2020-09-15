'use strict';

const forEach = require('lodash.foreach');
const set = require('lodash.set');

class Aggregator {
  constructor(statsHelpers, log) {
    this.statsHelpers = statsHelpers;
    this.log = log;
    this.stats = {};
  }

  _pushStats(path, value) {
    if (value === undefined || value === null) {
      this.log.debug(`stat ${path} was undefined, skipping`);
      return;
    }
    this.log.debug(`JD pushing stats ${path} : ${value}`);
    this.statsHelpers.pushStats(this.stats, path, value);
  }

  addToAggregate(result) {
    forEach(result.categories, category => {
      this.log.debug(`JD add to aggregate ${category.id} ${category.score}`);
      this._pushStats(['categories', category.id], category.score);
    });

    forEach(result.audits, audit => {
      switch (audit.scoreDisplayMode) {
        case 'numeric':
          this.log.debug(`JD add to aggregate audits ${audit.id} ${audit.numericValue}`);
          this._pushStats(['audits', audit.id], audit.numericValue);
          break;
        case 'binary':
          this.log.debug(`JD add to aggregate binary audits ${audit.id} ${audit.score}`);
          this._pushStats(['audits', audit.id], audit.score);
          break;
        default:
          break;
      }
    });
  }

  summarize() {
    if (Object.keys(this.stats).length === 0) {
      this.log.debug(`JD returning undefined due to stats length 0`);
      return undefined;
    }
    this.log.debug(`JD Sum per object`);
    return this.summarizePerObject(this.stats);
  }

  summarizePerObject(obj) {
    return Object.keys(obj).reduce((summary, name) => {
      const categoryData = {};
      forEach(obj[name], (stats, timingName) => {
        set(
          categoryData,
          timingName,
          this.statsHelpers.summarizeStats(stats, { decimals: 2 })
        );
      });
      summary[name] = categoryData;
      return summary;
    }, {});
  }
}

module.exports = Aggregator;
