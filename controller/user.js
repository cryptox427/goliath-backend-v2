// const multer = require('multer');
const jwt = require("jsonwebtoken");
var request = require("request");
// const sql = require("../config/mySql");
const bcrypt = require('bcryptjs');

const hashToken = async (params) => {
    const token = await jwt.sign(
        {
            rand: params.random,
            email: params.email,
            token: params.token
        },
        "websnake",
        {
            expiresIn: "1h",
            algorithm: "HS256",
        }
    );
    return token;
};

const signUpWithEmail = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password
    } = req.body;
    var isUser = false;
    sql.query(`SELECT * from usertable where email = '${email}'`, async function (err, result) {
        if (err) throw err;
        Object.keys(result).forEach(function(key) {
            if(result.length > 0) {
                isUser = true;
            }
        });

        if(isUser == false) {
            const savedUser = {};
            const salt = await bcrypt.genSalt(10);
            savedUser['firstName'] = firstName;
            savedUser['lastName'] = lastName;
            savedUser['email'] = email;
            savedUser['password'] = await bcrypt.hash(password, salt);
            sql.query(`INSERT INTO usertable (firstName, lastName, email, password) VALUES ('${firstName}', '${lastName}', '${email}', '${savedUser['password']}')`, function (err) {
                if (err) throw err;
                console.log("1 record inserted");
            });
            jwt.sign(
                savedUser,
                'secret',
                { expiresIn: '5 days' },
                (err, token) => {
                  if (err) throw err;
                  res.json({ token });
                }
            );
        } else {   
            return res.status(400).json({ msg: 'User already exist!' });
        }
    });
}

const signInWithEmail = async (req, res) => {
    const {
        email,
        password,
    } = req.body;
    var isUser = false;
    sql.query(`SELECT * from usertable where email = '${email}'`, async function (err, result) {
        if (err) throw err;
        isUser = Object.values(JSON.parse(JSON.stringify(result)))
        const isPassword = await bcrypt.compare(password, isUser[0]['password']);
        console.log(isUser);
        if(isUser.length == 0) {
            return res.status(400).json({ msg: 'User not exist!' });
        } else if (isPassword == false) {
            return res.status(400).json({ msg: 'Password is incorrect!' });
        } else {
            const user = {};
            user['email'] = email;
            user['password'] = password;

            jwt.sign(
                user,
                'secret',
                { expiresIn: '5 days' },
                (err, token) => {
                  if (err) throw err;
                  res.json({status: 'ok', token: token });
                }
            );
        }
    });
}


const Sendblue = async (email, link) => {
    var options = {
        method: 'POST',
        url: 'https://api.sendinblue.com/v3/smtp/email',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': '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'
        },
        body: {
          sender: {name: 'fedir', email: 'fedirpiddu@outlook.com'},
          to: [{email: email}],
          subject: 'Forgot your password? It happends to the bet of us.',
          htmlContent: `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8" />
                      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Document</title>
                      <style>
                      .container {
                          margin-left: auto;
                          margin-right: auto;
                          width: 100%;
                          max-width: 700px;
                          line-height: 1.8rem;
                          font: small/ 1.5 Arial, Helvetica, sans-serif;
                          padding: 10px 20px;
                          border: solid 1px #d5d0d0;
                          border-radius: 10px;
                          font-size: 15px;
                          color: black;
                      }
                      .btn {
                          display: inline-block;
                          font-weight: 400;
                          line-height: 1.5;
                          color: #212529;
                          text-align: center;
                          text-decoration: none;
                          vertical-align: middle;
                          cursor: pointer;
                          -webkit-user-select: none;
                          -moz-user-select: none;
                          user-select: none;
                          background-color: transparent;
                          border: 1px solid transparent;
                          padding: 0.375rem 0.75rem;
                          font-size: 1rem;
                          border-radius: 0.25rem;
                          transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
                          border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                          color: #fff;
                          background-color: #0d6efd;
                          border-color: #0d6efd;
                      }
                      table {
                          width: 100%;
                      }
                      </style>
                  </head>
                  <body>
                      <div class="container">
                      <table>
                          <tbody>
                          </tbody>
                      </table>
                      <table>
                          <tbody>
                          <tr>
                              <td>
                              <h2 style="text-align: center">Dear toptopdesign User</h2>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                  We have received your request to reset your password.
                              </td>
                          </tr>
                          <tr>
                              <td>Please click the link below to complete the reset:</td>
                          </tr>
                          <tr>
                              <td style="text-align: center">
                              <a
                                  href="${link}"
                                  class="btn"
                                  style="margin-top: 1.2rem; margin-bottom: 1.2rem; color: white;"
                                  >Reset password</a
                              >
                              </td>
                          </tr>
                          </tbody>
                      </table>
                      </div>
                  </body>
                  </html>
                  `,
        },
        json: true
      };
      
      await request(options, function (error, response, body) {
          console.log(body);
      });
};

const forgetsendmail = async (req, res) => {
    const { email } = req.body;
    console.log(email);
    sql.query(`SELECT * from usertable where email = '${email}'`, async function (err, result) {
        if (err) throw err;
        isUser = Object.values(JSON.parse(JSON.stringify(result)))
        console.log(isUser);
        if(isUser.length == 0) {
            return res.status(400).json({ msg: 'User not exist!' });
            
        } else {
            let random = Math.floor(Math.random() * 100 + 54);
            const newPassword = 'user12345';
            const token = await hashToken({ random, email, token: '' });
            const link = 'http://localhost:5000' + `/reset/password/${token}/${newPassword}`;
            const user = {};
            await Sendblue(email, link);
            const salt = await bcrypt.genSalt(10);
            user.resetcode = token;
            user.password = await bcrypt.hash(newPassword, salt);
            
            sql.query(`UPDATE usertable SET resetcode = '${token}', password = '${user.password}' WHERE email = '${email}'`, function (err) {
                if (err) throw err;
                console.log("1 record inserted");
            });
            return res.send({
                status: 'ok',
                user: user
            })
        }
    });
};

const resetPassword = async(req, res) => {
    const { token, password } = req.body;
    const result = await Users.find({ resetcode: token });
    if(result[0].password === password){
        return res.send({
            status: 'ok',
            userInfo: result[0],
        })
    }else{
        return res.send({
            status: 'error',
            message: 'password not match',
        })
    }
}

module.exports = {
    signUpWithEmail,
    signInWithEmail,
    forgetsendmail,
    resetPassword,
};