const PNF = require("google-libphonenumber").PhoneNumberFormat;
const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();
const fs = require("fs");

csv = fs.readFileSync("input.csv");

var arr = csv.toString().split("\r\n");
var output = [];

var columnName = arr[0].split(",");

arr = arr.map((line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/));

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
    // Verifica se é coluna sem espaço
    if (!columnName[index].trim().includes(" ")) {
      if (columnName[index]?.toLowerCase().trim() === "eid") {
        // Verifica se o eid já foi cadastrado anteriormente
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
            ...value
              .trim()
              .split(",")
              .map((v) => v.replace('"', "").trim()),
          ];
        } else {
          obj.groups = [
            ...obj.groups,
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

fs.writeFileSync("output.json", JSON.stringify(output, null, 2));

// Verifica se o e-mail tem a estrutura de um e-mail
function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

// Verifica se tem a estrutura de um numero telefonico brasileiro
function validatePhone(phone) {
  try {
    const number = phoneUtil.parseAndKeepRawInput(phone, "BR");
    return phoneUtil.isValidNumberForRegion(number, "BR");
  } catch (error) {
    return false;
  }
}

// Colocar o código do pais no numero telefonico
function numberPhone(phone) {
  const number = phoneUtil.parseAndKeepRawInput(phone, "BR");
  return phoneUtil.format(number, PNF.E164);
}
