function Event_(sender,type,data) {
    this.sender = sender;
    this.type   = type;
    this.data   = data;
}
module.exports = Event_;