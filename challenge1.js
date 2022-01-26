// 1) parse 50 1 page documents searching for a few variable values and when you find them multiply those values together. if greater than a certain threshold mark true else false

const extract = require("pdf-text-extract");

function main(filePath) {
  console.log(`...Parsing ${filePath}`);
  extract(filePath, (err, pages) => {
    if (err) {
      return reject(err);
    }

    pages.forEach((page, pIndex) => {
      // console.log(page);
      const reg = /\$([0-9]|,)+/g;
      const matches = page.match(reg);
      // console.log(matches);

      const fields = [
        "PurchasePrice",
        "AppraisalValue",
        "YearlyMortgagePayment",
        "YearlyIncome",
        "AdditionalIncome",
        "DebtPayment",
        "PropertyTaxes",
      ];

      const d = {};

      fields.forEach((k, index) => {
        try {
          d[k] = +matches[index].replace("$", "").replace(",", "");
        } catch (e) {
          throw new Error(`${k} not found`);
        }
      });

      d.DownPayment = +page.match(/[0-9]+%/)[0].replace("%", "") / 100;

      d.LoanAmount = d.PurchasePrice * (1 - d.DownPayment);

      d.LTV = d.LoanAmount / Math.min(d.PurchasePrice, d.AppraisalValue);

      d.Front = d.YearlyMortgagePayment / (d.YearlyIncome + d.AdditionalIncome);

      d.Back =
        (d.DebtPayment + d.PropertyTaxes + d.YearlyMortgagePayment) /
        (d.YearlyIncome + d.AdditionalIncome);

      d.accepted =
        d.LTV < 0.85 ||
        (d.LTV >= 0.85 && d.LTV <= 1 && d.Front < 0.25 && d.Back < 0.35);

      console.log(pIndex + 1, d.accepted);
    });
  });
}

main("./Mortgage Interview Notes.pdf");
