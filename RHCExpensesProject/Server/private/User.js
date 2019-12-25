module.exports = class User
{
    constructor(id, username, name, email, accessToken)
    {
        this.id = id;
        this.username = username;
        this.name = name;
        this.email = email;
        this.accessToken = accessToken;
        this.resetPass = false;
    }
}