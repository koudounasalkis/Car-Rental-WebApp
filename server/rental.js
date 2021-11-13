class Rental {  

    constructor (id, vehicleId, category, brand, model, startDate, endDate, price) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.category = category;
        this.brand = brand;
        this.model = model;
        this.startDate = startDate;
        this.endDate = endDate;
        this.price = price;
    }

}

module.exports = Rental;

