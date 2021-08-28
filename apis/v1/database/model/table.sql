-- current user database schema
CREATE DATABASE users

CREATE TABLE userdata(
    userid VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    PRIMARY KEY(userid)
);

INSERT INTO userdata(userid, username, password, role) VALUES('QYRTEGS12', 'Suyog', '12345', 'superAdmin');

CREATE TABLE tokendata(
    userid VARCHAR(255) NOT NULL,
    tokenid VARCHAR(255),
    PRIMARY KEY(userid)
);

INSERT INTO tokendata(userid, tokenid) VALUES('suyog', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJQUTlEVjdRUiIsInVzZXJuYW1lIjoiQXJ1biBTaGFybWEiLCJyb2xlIjoidXNlciIsImlhdCI6MTYyNDUxNDU3MSwiZXhwIjoxNjI0NTE0ODcxfQ.vdAjR3_D_c9FkzK32Zlriq_d7J8gkN8Xd9ZOz74qUOY');