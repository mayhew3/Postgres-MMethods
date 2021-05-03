const pg = require('pg');
const assert = require('assert');

const databaseURL = process.env.DATABASE_URL;
const envName = process.env.envName;

assert(!!databaseURL, "No environment variable: DATABASE_URL");
assert(!!envName, "No environment variable: envName");

const pool = new pg.Pool({
  connectionString: databaseURL
});

if (envName.includes('heroku')) {
  pool.ssl = {
    rejectUnauthorized: false
  }
}

exports.selectSendResponse = function(response, sql, values) {

    pool.connect(function(err, client, done) {
      if (err) {
        console.error(err.message, err.stack);
        response.send("Connection error " + err.message);
      } else {

        client.query(sql, values, function (err, res) {
          done();

          if (err) {
            console.error(err.message, err.stack);
            response.send("Query error " + err.message);
          } else {
            return response.json(res.rows);
          }
        });
      }
    });

  };

exports.updateSendResponse = function(response, sql, values) {

    pool.connect(function(err, client, done) {

      if (err) {
        console.error(err.message, err.stack);
        response.send("Connection error " + err.message);
      } else {

        client.query(sql, values, function (err) {
          done();

          if (err) {
            console.error(err.message, err.stack);
            response.send("Query error " + err.message);
          } else {
            return response.json({msg: "Success"});
          }
        });
      }

    });

  };

exports.updateNoResponse = function(sql, values) {
    return new Promise(function(resolve, reject) {
      pool.connect(function(err, client, release) {
        if (err) {
          reject(err);
        } else {
          client.query(sql, values, function(err) {
            release();
            if (err) {
              reject(err);
            } else {
              resolve("Success!");
            }
          });
        }
      });
    });
  };

exports.selectNoResponse = function(sql, values) {
    return new Promise(function (resolve, reject) {
      pool.connect(function (err, client, release) {
        if (err) {
          reject(err);
        } else {
          client.query(sql, values, function (err, results) {
            release();
            if (err) {
              reject(err);
            } else {
              resolve(results.rows);
            }
          });
        }
      });
    });
  };

exports.buildUpdateQueryConfig = function(changedFields, tableName, rowID) {

    let sql = "UPDATE " + tableName + " SET ";
    let values = [];
    let i = 1;
    for (let key in changedFields) {
      if (changedFields.hasOwnProperty(key)) {
        if (values.length !== 0) {
          sql += ", ";
        }

        sql += (key + " = $" + i);

        const value = changedFields[key];
        values.push(value);

        i++;
      }
    }

    sql += (" WHERE id = $" + i);

    values.push(rowID);

    return {
      text: sql,
      values: values
    };
  };

exports.buildUpdateQueryConfigNoID = function(changedFields, tableName, identifyingColumns) {

    let sql = "UPDATE " + tableName + " SET ";
    let values = [];
    let i = 1;
    for (let key in changedFields) {
      if (changedFields.hasOwnProperty(key)) {
        if (values.length !== 0) {
          sql += ", ";
        }

        sql += (key + " = $" + i);

        const value = changedFields[key];
        values.push(value);

        i++;
      }
    }

    const lengthBeforeWheres = values.length;

    sql += " WHERE ";

    for (key in identifyingColumns) {
      if (identifyingColumns.hasOwnProperty(key)) {
        if (values.length !== lengthBeforeWheres) {
          sql += " AND ";
        }

        sql += (key + " = $" + i);

        value = identifyingColumns[key];
        values.push(value);

        i++;
      }
    }

    return {
      text: sql,
      values: values
    };
  };

exports.updateObjectWithChangedFieldsSendResponse = function(response, changedFields, tableName, rowID) {
    console.log("Update " + tableName + " with " + JSON.stringify(changedFields));

    const queryConfig = this.buildUpdateQueryConfig(changedFields, tableName, rowID);

    console.log("SQL: " + queryConfig.text);
    console.log("Values: " + queryConfig.values);

    return this.updateSendResponse(response, queryConfig.text, queryConfig.values);
  };

exports.updateObjectWithChangedFieldsNoResponse = function(changedFields, tableName, rowID) {
    console.log("Update " + tableName + " with " + JSON.stringify(changedFields));

    const queryConfig = this.buildUpdateQueryConfig(changedFields, tableName, rowID);

    console.log("SQL: " + queryConfig.text);
    console.log("Values: " + queryConfig.values);

    return this.updateNoResponse(queryConfig.text, queryConfig.values);
  };

exports.createInlineVariableList = function(arrSize, starting) {
    let varNumbers = [];
    for (let i = starting; i < (starting + arrSize); i++) {
      varNumbers.push('$' + i);
    }
    return varNumbers.join(', ');
  };
