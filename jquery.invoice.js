 (function (jQuery) {
    $.opt = {};  // jQuery Object

    jQuery.fn.invoice = function (options) {
        var ops = jQuery.extend({}, jQuery.fn.invoice.defaults, options);
        $.opt = ops;

        var inv = new Invoice();
        inv.init();

        jQuery('body').on('click', function (e) {
            var cur = e.target.id || e.target.className;

            if (cur == $.opt.addRow.substring(1))
                inv.newRow();

            if (cur == $.opt.delete.substring(1))
                inv.deleteRow(e.target);
            if(cur == $.opt.export.substring(1))
                inv.createItemQuantityPriceMatrix(true);    
            inv.init();
        });

        jQuery('body').on('keyup', function (e) {
            inv.init();
        });

        return this;
    };
}(jQuery));

function Invoice() {
    self = this;
}

Invoice.prototype = {
    constructor: Invoice,

    init: function () {
        this.calcTotal();
        this.calcTotalQty();
        this.calcSubtotal();
        this.calcGrandTotal();
        this.getTotalRowCount();
        this.createItemQuantityPriceMatrix(false);
        this.calculateVat();
    },

    /**
     * Calculate total price of an item.
     *
     * @returns {number}
     */
    calcTotal: function () {
         jQuery($.opt.parentClass).each(function (i) {
             var row = jQuery(this);
             var total = row.find($.opt.price).val() * row.find($.opt.qty).val();

             total = self.roundNumber(total, 2);

             row.find($.opt.total).html(total);
         });

         return 1;
     },
     /***
      * get total row count.
      */
     getTotalRowCount: function() {
         var total = 0;
        jQuery($.opt.parentClass).each(function (i) {
            total += 1;
        });
        return total;
     },
	
    /***
     * Calculate total quantity of an order.
     *
     * @returns {number}
     */
    calcTotalQty: function () {
         var totalQty = 0;
         jQuery($.opt.qty).each(function (i) {
             var qty = jQuery(this).val();
             if (!isNaN(qty)) totalQty += Number(qty);
         });

         totalQty = self.roundNumber(totalQty, 2);

         jQuery($.opt.totalQty).html(totalQty);

         return totalQty;
     },

    /***
     * Calculate subtotal of an order.
     *
     * @returns {number}
     */
    calcSubtotal: function () {
         var subtotal = 0;
         jQuery($.opt.total).each(function (i) {
             var total = jQuery(this).html();
             if (!isNaN(total)) subtotal += Number(total);
         });

         subtotal = self.roundNumber(subtotal, 2);

         jQuery($.opt.subtotal).html(subtotal);

         return subtotal;
     },

    /**
     * Calculate grand total of an order.
     *
     * @returns {number}
     */
    calcGrandTotal: function () {
        if(jQuery($.opt.vat_inclusive).is(":checked")){
            var grandTotal = Number(jQuery($.opt.subtotal).html())
            + Number(jQuery($.opt.shipping).val())
            - Number(jQuery($.opt.discount).val());
            grandTotal = self.roundNumber(grandTotal, 2);
            jQuery($.opt.grandTotal).html(grandTotal);
            return grandTotal;
        }else{
            var grandTotal = Number(jQuery($.opt.subtotal).html())
            + Number(jQuery($.opt.shipping).val())
            - Number(jQuery($.opt.discount).val()) +
            this.calculateVat() ;
            grandTotal = self.roundNumber(grandTotal, 2);
            jQuery($.opt.grandTotal).html(grandTotal);
            return grandTotal;
        }
    },

    /**
     * Add a row.
     *
     * @returns {number}
     */
    newRow: function () {
        jQuery(".item-row:last").after('<tr class="item-row"><td name="item_name_'+this.getTotalRowCount()+'" class="item-name"><div class="delete-btn"><input type="text" class="form-control item" placeholder="Item" type="text"><a class=' + $.opt.delete.substring(1) + ' href="javascript:;" title="Remove row">X</a></div></td><td><input name="price_'+this.getTotalRowCount()+'" class="form-control price" placeholder="Price" type="number"  step="0.01" value="0.00"> </td><td><input name="quantity_'+this.getTotalRowCount()+'" class="form-control qty" placeholder="Quantity" type="number" step="1" min="0"></td><td><span class="total">0.00</span></td></tr>');
        if (jQuery($.opt.delete).length > 0) {
            jQuery($.opt.delete).show();
        }

        return 1;
    },

    /**
     * Delete a row.
     *
     * @param elem   current element
     * @returns {number}
     */
    deleteRow: function (elem) {
        jQuery(elem).parents($.opt.parentClass).remove();

        if (jQuery($.opt.delete).length < 2) {
            jQuery($.opt.delete).hide();
        }

        return 1;
    },

    createItemQuantityPriceMatrix: function(mustRun) {
      if(mustRun){
        var quantities = [];
        var items = [];
        var prices = [];
        var obj = [];
        jQuery($.opt.qty).each(function(i){
            quantities[i] = jQuery(this).val();
        })
        
        jQuery($.opt.price).each(function(i){
            prices[i] = jQuery(this).val();
        })


        jQuery($.opt.item_names).each(function(i){
            items[i] = jQuery(this).val();
        })

        jQuery(quantities).each(function(i){
             obj[i] = {
                "item": items[i], 
                "price": prices[i],
                "quantity":quantities[i]
            };
        })
        var final = {
            "subtotal": this.calcSubtotal(),
            "shipping": Number(jQuery($.opt.shipping).val()),
            "discount": Number(jQuery($.opt.discount).val()),
            "grandTotal": this.calcGrandTotal(),
            "totalQuantity": this.calcTotalQty(),
            "vatPercentage": jQuery($.opt.vat_percentage).val(),
            "vatInclusive": jQuery($.opt.vat_inclusive).is(":checked"),
            "billingName": jQuery($.opt.billing_name).val(),
            "billingAddress": jQuery($.opt.billing_address).val(),
            "shippingAddress":jQuery($.opt.shipping_address).val(),
            "paymentMethod":jQuery($.opt.payment_method).val(),
            "orderDate":jQuery($.opt.order_date).val(),
            "orderNumber": jQuery($.opt.order_number).val(),
            "lines": obj
            
        };

        var exportable = JSON.stringify(final);
        $.opt.function_on_export(exportable);
        return exportable;
       }
       return '';
    },

    /**
     * Round a number.
     * Using: http://www.mediacollege.com/internet/javascript/number/round.html
     *
     * @param number
     * @param decimals
     * @returns {*}
     */
    roundNumber: function (number, decimals) {
        var newString;// The new rounded number
        decimals = Number(decimals);

        if (decimals < 1) {
            newString = (Math.round(number)).toString();
        } else {
            var numString = number.toString();

            if (numString.lastIndexOf(".") == -1) {// If there is no decimal point
                numString += ".";// give it one at the end
            }

            var cutoff = numString.lastIndexOf(".") + decimals;// The point at which to truncate the number
            var d1 = Number(numString.substring(cutoff, cutoff + 1));// The value of the last decimal place that we'll end up with
            var d2 = Number(numString.substring(cutoff + 1, cutoff + 2));// The next decimal, after the last one we want

            if (d2 >= 5) {// Do we need to round up at all? If not, the string will just be truncated
                if (d1 == 9 && cutoff > 0) {// If the last digit is 9, find a new cutoff point
                    while (cutoff > 0 && (d1 == 9 || isNaN(d1))) {
                        if (d1 != ".") {
                            cutoff -= 1;
                            d1 = Number(numString.substring(cutoff, cutoff + 1));
                        } else {
                            cutoff -= 1;
                        }
                    }
                }

                d1 += 1;
            }

            if (d1 == 10) {
                numString = numString.substring(0, numString.lastIndexOf("."));
                var roundedNum = Number(numString) + 1;
                newString = roundedNum.toString() + '.';
            } else {
                newString = numString.substring(0, cutoff) + d1.toString();
            }
        }

        if (newString.lastIndexOf(".") == -1) {// Do this again, to the new string
            newString += ".";
        }

        var decs = (newString.substring(newString.lastIndexOf(".") + 1)).length;

        for (var i = 0; i < decimals - decs; i++)
            newString += "0";
        //var newNumber = Number(newString);// make it a number if you like

        return newString; // Output the result to the form field (change for your purposes)
    },

    calculateVat: function(){
        if(jQuery($.opt.vat_inclusive).is(":checked")){
            var percent = Number(jQuery($.opt.vat_percentage).val())/100;
            var vatexclusive = (this.calcGrandTotal()/(1 + percent));
            var vat = this.calcGrandTotal() - vatexclusive
            vat = self.roundNumber(vat, 2);
            jQuery($.opt.vat).html(vat);
            return Number(vat);
        }else {
            var percent = Number(jQuery($.opt.vat_percentage).val())/100;
            var vat = (Number(jQuery($.opt.subtotal).html())
            + Number(jQuery($.opt.shipping).val())
            - Number(jQuery($.opt.discount).val())) * percent;
            vat = self.roundNumber(vat, 2);
            jQuery($.opt.vat).html(vat);
            return Number(vat);
        }
    }
};

/**
 *  Publicly accessible defaults.
 */
jQuery.fn.invoice.defaults = {
    addRow: "#addRow",
    delete: ".delete",
    parentClass: ".item-row",
    item_names: ".item-name",
    price: ".price",
    qty: ".qty",
    total: ".total",
    totalQty: "#totalQty",
    export : "#export",
    subtotal: "#subtotal",
    discount: "#discount",
    shipping: "#shipping",
    grandTotal: "#grandTotal",
    vat_inclusive: "#vatInclusive",
    vat: "#vat",
    vat_percentage: "#vatPercentage",
    billing_name: "#billingName",
    billing_address: "#billingAddress",
    shipping_address: "#shippingAddress",
    payment_method: "#paymentMethod",
    order_date: "#orderDate",
    order_number: "#orderNumber",
    function_on_export: function(){
        //empty function
    }
};
