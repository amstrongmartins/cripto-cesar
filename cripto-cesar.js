var token = 'SEU-TOKEN';
var url = 'https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=';
var submitUrl = 'https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token='
const fetch = require('node-fetch');
const fs = require('fs');
const sha1 = require('js-sha1');
const FormData = require('form-data');

var fileData = '';

console.log('Requisitando dados');
fetch(url+token)
    .then((res) => res.text())
    .then((data) => {
        fileData = data;
        console.log('Dados recebidos: ');
        console.log(fileData);
        createFile(fileData);
    });

function createFile( fileData ) {
    console.log('Abrindo arquivo json.');
    fs.open('answer.json', 'a+', (err, file) => {
        if(err) {
            throw err;
        }
        let len = 512;
        let buffer = Buffer.alloc(len);
        let offset = 0;
        let pos = 0;
        let data = JSON.parse(fileData);

        console.log('Decifrando texto cifrado e gerando resumo criptográfico.');
        decipher(data);
    
        fs.read(file, buffer, offset, len, pos, (err, bytes, buf) => {
            if(err) {
                throw err;
            }
    
            if(bytes) {
                console.log('Arquivo contém dados:');
                console.log(buf.toString());
            } else {
                console.log('Gravando dados no arquivo.');
                let bufferToWrite = Buffer.from(JSON.stringify(data));
                let len2 = bufferToWrite.length;
    
                fs.write(file, bufferToWrite, offset, len2, (err, bytes, buf) => {
                    if(err) {
                        throw err;
                    }
    
                    if(bytes) {
                        console.log('Conteúdo gravado no arquivo: ');
                        console.log('\n',buf.toString());
                        console.log('Enviando arquivo para correção.');
                        let bufferStream = fs.createReadStream('answer.json');
                        sendFile(submitUrl, token, bufferStream)
                            .then((data) => {
                                console.log(data);
                            })
                    } else {
                        console.log('Nada foi gravado no arquivo.');
                    }
                });
            }
        })
    })
}

async function sendFile(urlReq, tokenAPI, fileData) {
    const form = new FormData();
    form.append('answer', fileData, {
        contentType: 'text/plain',
        name: 'answer',
        filename: 'answer.json'
    });

    const options = {
        method: 'POST',
        body: form
    }
    console.log(form);
    const res = await fetch(urlReq + tokenAPI, options);
    return await res.json();
}

function decipher(data) {
    let key = data.numero_casas;
    let context = data.cifrado;
    let str = context.toLowerCase();
    let letters = 'abcdefghijklmnopqrstuvwxyz'; //26

    for(let i = 0; i < str.length; i++) {
        //str.charAt(i);
        for(let j = letters.length; j >= 0; j--) {
            if(str.charAt(i) == letters.charAt(j)) {
                if(j < key) {
                    let x = j - key;
                    let l = letters.length;
                    data.decifrado += letters.charAt(l+x);
                } else {
                    data.decifrado += letters.charAt(j-key);
                }
                break;
            } else if(str.charAt(i) == ' ') {
                data.decifrado += str.charAt(i);
                break;
            } else if(str.charAt(i) == '.') {
                data.decifrado += str.charAt(i);
                break;
            }
        }
    }
    
    data.resumo_criptografico = sha1(data.decifrado);
}