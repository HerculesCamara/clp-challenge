const PNF = require("google-libphonenumber").PhoneNumberFormat;
const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();
const fs = require("fs");

csv = fs.readFileSync("input.csv");

var arr = csv.toString().split("\r\n");
var output = [];

var columnName = arr[0].split(",");

arr = arr.map((line) => {
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
});

var obj = {};
var aux = {};

for (var i = 0; i < columnName.length - 1; i++) {
  if (!columnName[i].includes(" ")) {
    if (columnName[i].includes("group")) {
      obj["groups"] = [];
    } else {
      obj[columnName[i]] = "";
    }
  }
}

for (var i = 1; i < arr.length; i++) {
  obj.groups = [];
  obj["addresses"] = [];

  repeat = -1;

  arr[i].forEach((value, index) => {
    /* console.log("'", columnName[index], "'"); */
    function insertAdresses() {
      var columnNameSplited = columnName[index].split(" ");
      var auth;
      var email;
      var phone;
      var aux2;

      if (validatePhone(value)) {
        phone = value;
        auth = true;
      } else if (value.includes(" ")) {
        aux2 = value.split(" ");
        for (var i = 0; i < aux2.length; i++) {
          if (validateEmail(aux2[i])) {
            email = aux2[i];
            auth = true;
          }
        }
      } else if (value.includes("/")) {
        aux2 = value.split("/");
        for (var i = 0; i < aux2.length; i++) {
          if (validateEmail(aux2[i])) {
            email = aux2[i];
            columnNameSplited.forEach((column, position) => {
              column = column.replace('"', "");

              if (position === 0) {
                aux = { type: column };
              } else {
                if (aux.tags) {
                  aux = { ...aux, tags: [...aux.tags, column] };
                } else {
                  aux = { ...aux, tags: [column] };
                }
              }
            });
            aux = { ...aux, address: email };
            obj["addresses"].push({ ...aux });
          }
        }
      } else {
        if (validateEmail(value)) {
          email = value;
          auth = true;
        }
      }

      if (auth) {
        columnNameSplited.forEach((column, position) => {
          column = column.replace('"', "");

          if (position === 0) {
            aux = { type: column };
          } else {
            if (aux.tags) {
              aux = { ...aux, tags: [...aux.tags, column] };
            } else {
              aux = { ...aux, tags: [column] };
            }
          }
        });

        if (email !== undefined) {
          aux = { ...aux, address: email };
        } else if (phone !== undefined) {
          aux = { ...aux, address: numberPhone(phone).replace("+", "") };
        }

        obj["addresses"].push({ ...aux });
      }
    }
    // Verifica se é colune sem espaço
    if (!columnName[index].trim().includes(" ")) {
      /* console.log(columnName[index]); */
      // verifica se é a coluna group e se há valor na coluna para adicionar em obj.groups

      if (columnName[index]?.toLowerCase().trim() === "eid") {
        if (output.map((e) => e.eid).indexOf(value) !== -1) {
          obj = output[output.map((e) => e.eid).indexOf(value)];
          repeat = output.map((e) => e.eid).indexOf(value);
        } else {
          obj[columnName[index]] = value.trim();
        }
      } else if (columnName[index]?.toLowerCase() === "group" && value.length) {
        // verifica se é separado por ","... se não for, ele faz split por "/"
        if (value.includes(",")) {
          obj.groups = [
            ...obj.groups,
            //isso faz remover os espaços e as aspas
            ...value
              .trim()
              .split(",")
              .map((v) => v.replace('"', "").trim()),
          ];
        } else {
          obj.groups = [
            ...obj.groups,
            //isso faz remover os espaços e as aspas
            ...value
              .trim()
              .split("/")
              .map((v) => v.replace('"', "").trim()),
          ];
        }
      } else if (columnName[index]?.toLowerCase() === "invisible") {
        if (value === "yes" || value === "1") {
          obj.invisible = true;
        } else {
          obj.invisible = false;
        }
      } else if (columnName[index]?.toLowerCase() === "see_all") {
        if (value === "yes" || value === "1") {
          obj.see_all = true;
        } else {
          obj.see_all = false;
        }
      } else if (columnName[index]?.toLowerCase() !== "group") {
        obj[columnName[index]] = value.trim();
      }
    } else {
      insertAdresses();
    }
  });

  if (repeat !== -1) {
    output[repeat] = { ...obj };
  } else {
    output.push({ ...obj });
  }
}

/* console.log(JSON.stringify(output, null, 2)); */

fs.writeFileSync("output.json", JSON.stringify(output, null, 2));

function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function validatePhone(phone) {
  try {
    const number = phoneUtil.parseAndKeepRawInput(phone, "BR");
    return phoneUtil.isValidNumberForRegion(number, "BR");
  } catch (error) {
    return false;
  }
}

function numberPhone(phone) {
  const number = phoneUtil.parseAndKeepRawInput(phone, "BR");
  return phoneUtil.format(number, PNF.E164);
}
