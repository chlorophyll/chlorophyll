import osc from 'osc';

class UDPPortStub {
    constructor() {}

    on() {}

    open() {}
};

let UDPPort;
if (process.env.NODE_ENV === 'test')
    UDPPort = UDPPortStub;
else
    UDPPort = osc.UDPPort;

export default UDPPort;
