module.exports = {
    endpoints: {
        session: 'https://company.symphony.com:8444/sessionauth/v1/authenticate',
        keymanager: 'https://company.symphony.com:8444/keyauth/v1/authenticate',
        pod: 'https://company.symphony.com/pod',
        agent: 'https://company.symphony.com/agent'
    },

    bot: {
        cert: `-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----`,
        key: `-----BEGIN RSA PRIVATE KEY-----
-----END RSA PRIVATE KEY-----        `
    }
}