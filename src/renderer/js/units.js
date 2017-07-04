import Util from 'util';

function binop(oper) {
	return function(a, b) {
		var target, lhs, rhs, val;

		if (!a || !b || a.isConvertibleTo == undefined || b.isConvertibleTo == undefined)
			return oper(a,b);

		if (a.isConvertibleTo(b.constructor)) {
			lhs = b;
			val = a;
		} else if (b.isConvertibleTo(a.constructor)) {
			lhs = a;
			val = b;
		} else {
			return oper(a, b);
		}

		var rhs = val.convertTo(lhs.constructor);

		return new lhs.constructor(oper(lhs, rhs));
	}
}
_Units = {
	Operations: {
		add: binop(function(a,b) { return a+b; }),
		sub: binop(function(a,b) { return a-b; }),
		mul: binop(function(a,b) { return a*b; }),
		div: binop(function(a,b) { return a/b; }),
		mod: binop(function(a,b) { return a%b; }),
	},
}


Units = new Proxy(_Units, {
	set: function(obj, prop, value) {
		obj[prop] = value;

		value._unit_name = prop;

		value.prototype.serialize = function() {
			return this.val;
		}

		value.deserialize = function(prop) {
			return new value(prop);
		}
		Util.JSON.addType(prop, value);

		value.isConvertibleUnit = true;

		value.prototype.isConvertibleTo = function(constructor) {
			if (!constructor || !constructor._unit_name)
				return false;
			if (this.constructor == constructor)
				return true;
			return this.conversions[constructor._unit_name] !== undefined;
		}

		value.prototype.convertTo = function(constructor) {
			if (!constructor || !constructor._unit_name)
				return undefined;

			if (this.constructor == constructor)
				return new this.constructor(this.val);

			return new constructor(this.conversions[constructor._unit_name].call(this));
		}

		value.prototype.valueOf = function() {
			return this.val;
		}

		value.prototype.toString = function() {
			return this.val.toString();
		}

		value.prototype.clone = function() {
			return new value(this.val);
		}
	}
});

Units.Numeric = function(val) {
	this.val = val;
}

Units.Numeric.prototype.isConvertibleTo = function() { return true; }
Units.Numeric.prototype.convertTo = function(constructor) {
	if (!constructor || !constructor._unit_name)
		return undefined;
	return new constructor(this.val);
}

Units.Percentage = function(val) {
	this.val = val;
}

Units.Percentage.prototype.conversions = {
	UInt8: function() {
		return this.val * 0xff;
	},
	Angle: function() {
		return this.val * Math.PI * 2;
	}
}

Units.UInt8 = function(val) {
	this.val = val & 0xff;
}

Units.UInt8.isIntegral = true;

Units.Distance = function(val) {
	this.val = val;
}
Units.Distance.prototype.conversions = {
	Percentage: function() {
		return 0.5 * (this.val + 1);
	},
	UInt8: function() {
		return 0.5 * (this.val + 1) * 0xff;
	}
}

Units.Angle = function(val) {
	this.val = val;
}

Units.Angle.prototype.conversions = {
	Percentage: function() {
		return this.val / (2*Math.PI);
	},
	UInt8: function() {
		return this.val / (2*Math.PI) * 0xff;
	}
}

export { Units };
