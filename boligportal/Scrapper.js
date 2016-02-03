import _ from 'lodash';
import nodemailer from 'nodemailer';
import request from 'superagent';

const BASE_URL = 'http://www.boligportal.dk';
const RESOURCE = 'api/soeg_leje_bolig.php';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

export default class Scrapper {

  constructor(opts) {
    this.opts = opts;
    this.boligProperties = [];
    this.email = opts.email;
    this.dry = opts.dry;
    this.firstRun = true;
  }

  scrap() {
    request
      .post(`${BASE_URL}/${RESOURCE}`)
      .type('form')
      .send({ data: this.serialize(this.opts) })
      .send({ serviceName: 'getProperties' })
      .end((err, res) => {

        if (!res.ok) {
          console.error(`Received an invalid status code ${res.statusCode}`);
          console.error(error);
          return;
        }

        let response = JSON.parse(res.text);
        if (_.isUndefined(response) || _.isUndefined(response.properties) ||
          _.isEmpty(response.properties)) {
          console.error('Received a non-deserializable response');
        }

        response.properties
          .map((property) => {
            return this.deserialize(property)
          })
          .forEach((property) => {
            if (!_.any(this.boligProperties, _.matches(property)) && !property.reserved) {
              this.boligProperties.push(property);
              if (this.dry) {
                  console.log(`[DRY] ${new Date()}: ${property.headline} - ${property.economy.rent}DKK : ${property.location.street}, ${property.location.zipcode}`);
              } else {
                if (!this.firstRun) {
                  this.sendEmail(property);
                } 
              }
            }
          });
        if (this.firstRun) {
          console.log('First run passed and fetched ' + this.boligProperties.length + ' properties');
          this.firstRun = false;
        }
      });
  }

  sendEmail(property) {
    transporter.sendMail({
      from: 'boligscraper@gmail.com',
      to: this.email,
      subject: `${property.headline} - ${property.economy.rent}`,
      text: `http://www.boligportal.dk${property.url}`
    }, (err, info) => {
      if (err) {
        console.error(err);
      }
      console.log(`${new Date()}: ${property.headline} - ${property.economy.rent}DKK : ${property.location.street}, ${property.location.zipcode}`);
    });
  }

  deserialize(property) {
    return {
      id: property.jqt_adId,
      creationDate: property.jqt_creationDate,
      creationDateZ: property.jqt_creationDateZ,
      creationDateF: property.jqt_creationDateF,
      headline: property.jqt_headline,
      description: property.jqt_adtext,
      highlight: property.jqt_adHighlight,
      saved: property.jqt_adSaved,
      active: property.jqt_active,
      reserved: property.jqt_reserved,
      rented: property.jqt_udlejet,
      contacted: property.jqt_contacted,
      type: property.jqt_type,
      rentalPeriod: property['jqt_rental period'],
      sublease: property.jqt_adSublease,
      furnished: property.jqt_furnished,
      size: property.jqt_size,
      location: property.jqt_location,
      economy: property.jqt_economy,
      url: property.jqt_adUrl,
      images: property.jqt_images,
    };
  }

  serialize(opts) {
    return JSON.stringify({
      amtId: opts.region,
      huslejeMin: opts.rent.min.toString() || "0", // rent min
      huslejeMax: opts.rent.max.toString(), // rent max
      stoerrelseMin: "", // size min
      stoerrelseMax: "", // size max
      postnrArr: opts.zip, // zip codes
      boligTypeArr: opts.types, // apartment types
      lejeLaendgeArr: ['4'], // rent length
      page: "1",
      limit: "50",
      sortCol: "3",
      sortDes: "1",
      visOnSiteBolig: "", // show on site appartment
      almen: "", // default
      billeder: "", // pictures
      husdyr: "", // house pets
      mobleret: "", // furnished
      delevenlig: "", // shareable
      fritekst: "", // description
      overtagdato: "", // take over date
      emailservice: "",
      kunNyeste: "", // only latest
      muListeMuId: "",
      fremleje: "" // sublease
    })
  }

}
