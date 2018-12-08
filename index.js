const pg = require('pg');
const config = process.env.DATABASE_URL;

exports.executeQueryWithResults = function(response, sql, values) {

    const pool = new pg.Pool({
      connectionString: config
    });

    pool.connect(function(err, client, done) {
      client.query(sql, values, function(err, res) {
        done();

        if (err) {
          console.error(err);
          response.send("Query error " + err);
        } else {
          return response.json(res.rows);
        }
      });

      if (err) {
        console.error(err);
        response.send("Connection error " + err);
      }

    });

    pool.end();
  };

exports.executeQueryNoResults = function(response, sql, values) {

    const pool = new pg.Pool({
      connectionString: config
    });

    pool.connect(function(err, client, done) {
      client.query(sql, values, function(err) {
        done();

        if (err) {
          console.error(err);
          response.send("Query error " + err);
        } else {
          return response.json({msg: "Success"});
        }
      });

      if (err) {
        console.error(err);
        response.send("Connection error " + err);
      }

    });

    pool.end();
  };

exports.updateNoJSON = function(sql, values) {
    return new Promise(function(resolve, reject) {
      const pool = new pg.Pool({
        connectionString: config
      });

      pool.connect(function(err, client, done) {
        client.query(sql, values, function(err) {
          done();

          if (err) {
            console.error(err);
            reject(Error("Query error " + err));
          } else {
            resolve("Success!");
          }
        });

        if (err) {
          console.error(err);
          reject(Error("Connection error " + err));
        }

      });

      pool.end();
    });

  };

exports.selectWithJSON = function(sql, values) {
    return new Promise(function (resolve, reject) {
      const pool = new pg.Pool({
        connectionString: config
      });

      pool.connect(function (err, client, done) {
        client.query(sql, values, function (err, res) {
          done();

          if (err) {
            console.error(err);
            pool.end();
            reject(Error("Query error " + err));
          } else {
            pool.end();
            resolve(res.rows);
          }
        });

        if (err) {
          console.error(err);
          pool.end();
          reject(Error("Connection error " + err));
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

exports.updateObjectWithChangedFields = function(response, changedFields, tableName, rowID) {
    console.log("Update " + tableName + " with " + JSON.stringify(changedFields));

    const queryConfig = this.buildUpdateQueryConfig(changedFields, tableName, rowID);

    console.log("SQL: " + queryConfig.text);
    console.log("Values: " + queryConfig.values);

    return this.executeQueryNoResults(response, queryConfig.text, queryConfig.values);
  };

exports.updateObjectWithChangedFieldsNoJSON = function(changedFields, tableName, rowID) {
    console.log("Update " + tableName + " with " + JSON.stringify(changedFields));

    const queryConfig = this.buildUpdateQueryConfig(changedFields, tableName, rowID);

    console.log("SQL: " + queryConfig.text);
    console.log("Values: " + queryConfig.values);

    return this.updateNoJSON(queryConfig.text, queryConfig.values);
  };

exports.createInlineVariableList = function(arrSize, starting) {
    let varNumbers = [];
    for (let i = starting; i < (starting + arrSize); i++) {
      varNumbers.push('$' + i);
    }
    return varNumbers.join(', ');
  };
