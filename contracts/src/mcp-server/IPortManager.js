/**
 * Custom errors for port management
 */
export class NoAvailablePortError extends Error {
    constructor(message = 'No available ports in range 3100-3299') {
        super(message);
        this.name = 'NoAvailablePortError';
    }
}
export class PortAlreadyReservedError extends Error {
    constructor(port) {
        super(`Port ${port} is already reserved`);
        this.name = 'PortAlreadyReservedError';
    }
}
//# sourceMappingURL=IPortManager.js.map