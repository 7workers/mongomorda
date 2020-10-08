class MongoMorda {
    form;
    arFields = {};
    fieldTemplateContainer;
    addFieldSelector;

    static TRANSFORM_IPV4_2_LONG = 'ipv4/long';

    /**
     *
     * @param qElement JQuery element of input field with JSON query (q)
     */
    constructor(qElement) {
        this.qElement = qElement;
        let that = this;
        qElement.on('change keyup blur', function (e) {
            that.onQTextInputChange(e.target.value);
        });
    }

    // when typing directly in "q" input field
    onQTextInputChange( v ) {
        let that = this;
        try {
            let q = JSON.parse(v);
            let prevValue = null;

            $.each(q, function (k, v) {
                if (that.arFields[k] === undefined) {
                    return;
                }
                prevValue = that.arFields[k].element.data('prevQValue');
                if( prevValue === v ) {
                    return;
                }

                if( typeof v === "object" ) {

                }

                console.log('field updated directly typing in the Q input: ' + k + ' value: ' + v);

                that.updateFieldControls(k, q);

                return;
                that.arFields[k].element.data('prevQValue', v);

                that.arFields[k].element.val(that.transformData(q, k, v, true));
            });

            $.each(that.arFields, function (k,v) {
                if( q[k] !== undefined ) {
                    return;
                }
                that.arFields[k].element.val('');
            });

            this.qElement.removeClass('is-invalid');
        } catch (e) {
            console.error(e);
            this.qElement.addClass('is-invalid');
        }
    }

    /**
     *
     * @param fieldName
     */
    onFieldControlStateChange(fieldName) {

        let value = this.arFields[fieldName].element.val();
        let rawValueJson = this.arFields[fieldName].element.attr('data-raw-value-json');

        switch (this.arFields[fieldName].element.type) {
            case 'checkbox':
                value = this.arFields[fieldName].element.checked;
                break;
            case 'select-one':
                let rawValueJson = this.arFields[fieldName].element.selectedOptions[0].dataset['rawValueJson'];
                if( rawValueJson !== undefined ) {
                    value = JSON.parse(rawValueJson);
                }
                break;
        }

        let operator = this.arFields[fieldName].operator;

        try {
            let q = JSON.parse(this.qElement.val());

            if (value !== '') {
                this.updateQObject(fieldName, q);
                //this.transformData(q, field, value);
            } else {
                delete q[fieldName];
            }

            console.log('Field changed : ' + fieldName + ' value = ' + value + ' operator: '  + operator);
            console.log(q);

            this.qElement.val(JSON.stringify(q));
            this.qElement.removeClass('is-invalid');
        } catch (e) {
            console.log(e);
            this.qElement.addClass('is-invalid');
        }
    }

    bindAddFieldControl(id, idTemplatesContainer ) {
        let that = this;
        this.addFieldSelector = $('#' + id);
        this.fieldTemplateContainer = $('#' + idTemplatesContainer);

        this.fieldTemplateContainer.children().each(function (k,v) {
            let idTemplate = v.getAttribute('id');
            let label = $(v).find('[data-label]').first().data('label');

            that.addFieldSelector.append('<option value="'+idTemplate+'">'+label+'</option>');
            console.log(v);
        });

        this.addFieldSelector.on('change', function (e) {
            let selectedField = that.addFieldSelector.val();
            that.addFieldSelector.val('');

            console.log('add field' +selectedField);

            let templateHtml = $('#'+selectedField);

            that.addFieldFromTemplate(templateHtml);




            //that.loadPredefined(e.target.value);
        });
    }

    addFieldFromTemplate(templateHtml) {
        let that = this;

        if( templateHtml.data('isAdded')===true) {
            return;
        }

        let controlElement = templateHtml.find('[data-field-name]')
        let fieldName = controlElement.data('fieldName');

        if( fieldName === undefined || fieldName === '' ) {
            console.error('cannot add field control - field name undefined');
            return;
        }

        if( that.arFields[fieldName] !== undefined ) {
            that.arFields[fieldName]['element'].addClass('alert-danger');
            setTimeout(function () {
                that.arFields[fieldName]['element'].removeClass('alert-danger');
            }, 2000);
            return;
        }

        let parentHtml = templateHtml.parent();
        templateHtml.data('isAdded', true);

        if( templateHtml.length === 0 ) {
            console.error('template html not found for ID='+selectedField);
            return;
        }

        let btnRemove = templateHtml.find('button.mmorda-remove-field');

        if( btnRemove.length === 1 ) {
            btnRemove.on('click',function (e) {
                btnRemove.off();
                that.removeField(fieldName);
                parentHtml.append(templateHtml);
                templateHtml.data('isAdded', false);
            });
        }

        let operatorSelector = templateHtml.find('button.mmorda-operator');

        if( operatorSelector.length === 1 ) {
            operatorSelector.data('mmordaFieldName', fieldName);
            operatorSelector.next().find('.dropdown-item').each(function (k,v) {
                let element = $(v);
                let fieldNameSelectorThis = operatorSelector.data('mmordaFieldName');
                element.attr('href', 'javascript:void(0)');
                element.on('click', function (e) {
                    let label = e.target.innerHTML;
                    operatorSelector.html(label);
                    operatorSelector.data('mordaModifier', element.data('mmordaOperator'));
                    that.setFieldOperator(fieldNameSelectorThis, element.data('mmordaOperator'));
                    that.onFieldControlStateChange(fieldNameSelectorThis);
                });
            });
        } else {
            operatorSelector = null;
        }

        that.addField(fieldName, controlElement, controlElement.data('transform'), '',);

        that.arFields[fieldName].operatorSelector = operatorSelector;

        that.addFieldSelector.parent().before(templateHtml);
    }

    setFieldOperator(field, operator) {
        console.log(field + ' operator = ' + operator);
        this.arFields[field]['operator'] = operator;
    }

    addField(name, element, transform, operator, options) {
        if (this.arFields[name] !== undefined) {
            throw 'Field ' + name + ' already added';
        }

        let that = this;

        if (transform === undefined) transform = 'string';
        if (options === undefined) options = {};

        if (transform === 'regex') {
            options.regexOptions = options.regexOptions !== undefined ? options.regexOptions : 'i';
        }

        element.on('change keyup blur', function (e) {
            let field = e.target.getAttribute('data-field-name');
            that.onFieldControlStateChange(field);
        });

        that.arFields[name] = {
            element: element,
            transform: transform,
            options: options,
            operator: operator
        };

        console.log(that.arFields);
    }

    removeField(name) {
        if( this.arFields[name] === undefined ) {
            throw name + ' field not exists';
        }

        this.arFields[name].element.off();


        try {
            let q = JSON.parse(this.qElement.val());

            delete q[name];

            console.log('Field removed changed : ' + name);
            console.log(q);

            this.qElement.val(JSON.stringify(q));
            this.qElement.removeClass('is-invalid');
        } catch (e) {
            console.log(e);
            this.qElement.addClass('is-invalid');
        }

        delete this.arFields[name];
    }

    updateQ(field, value) {
        let q_string = this.form.find('#q').val();
        let that = this;
        try {
            let q = JSON.parse(q_string);

            if( field !== 'q' ) {
                if( value !== '') {
                    that.transformData(q, field, value);
                } else {
                    delete q[field];
                }
            } else {
                $.each(q, function (k, v) {
                    if( that.arFields[k] === undefined) {
                        return;
                    }
                    //console.log(v);

                    that.arFields[k].element.val(that.transformData(q, k, v, true));
                });

                console.log(that.arFields);

                $.each(that.arFields, function (k,v) {
                    if( q[k] !== undefined || k === 'q' ) {
                        return;
                    }
                    that.arFields[k].element.val('');
                });
            }

            this.form.find('#q').val(JSON.stringify(q));
            this.form.find('#q').removeClass('is-invalid');
        } catch (e) {
            console.log(e);
            this.form.find('#q').addClass('is-invalid');
        }
    }



    /**
     * This method should update form control element, fired when something is typed directly into query text input field
     * @param fieldName
     * @param dQuery object holding query as seen in the input box
     */
    updateFieldControls(fieldName, dQuery) {
        let that = this;

        if( dQuery[fieldName] === undefined ) {
            return;
        }

        let fnTransform = function(v) { return v;};

        switch (this.arFields[fieldName].transform) {
            case MongoMorda.TRANSFORM_IPV4_2_LONG:
                fnTransform = function (v) { return that.int2ip(v); };
                break;
        }

        let operator = '$eq';
        let value = dQuery[fieldName];

        if( typeof dQuery[fieldName] === 'object' ) {
            if( dQuery[fieldName]['$ne'] !== undefined ) {
                operator = '$ne';
                value = fnTransform(dQuery[fieldName]['$ne']);
            }
            if( dQuery[fieldName]['$eq'] !== undefined ) {
                operator = '$eq';
                value = fnTransform(dQuery[fieldName]['$eq']);
            }
            if( dQuery[fieldName]['$lt'] !== undefined ) {
                operator = '$lt';
                value = fnTransform(dQuery[fieldName]['$lt']);
            }
            if( dQuery[fieldName]['$lte'] !== undefined ) {
                operator = '$lte';
                value = fnTransform(dQuery[fieldName]['$lte']);
            }
            if( dQuery[fieldName]['$gt'] !== undefined ) {
                operator = '$gt';
                value = fnTransform(dQuery[fieldName]['$gt']);
            }
            if( dQuery[fieldName]['$gte'] !== undefined ) {
                operator = '$gte';
                value = fnTransform(dQuery[fieldName]['$gte']);
            }
            if( dQuery[fieldName]['$in'] !== undefined ) {
                operator = '$in';
                value = $.map(dQuery[fieldName]['$in'],fnTransform).join(',');
            }
            if( dQuery[fieldName]['$nin'] !== undefined ) {
                operator = '$nin';
                value = $.map(dQuery[fieldName]['$nin'],fnTransform).join(',');
            }
        }

        if( this.arFields[fieldName].operatorSelector !== null) {
            let elemOperator = this.arFields[fieldName].operatorSelector.next().find('[data-mmorda-operator="'+operator+'"]');
            if( elemOperator.length === 1 ) {
                this.arFields[fieldName].operatorSelector.html(elemOperator.html());
            }
            //this.updateOperatorSelector(field, operator);
        }



        this.arFields[fieldName].element.val(value);

        return;

        let transform = this.arFields[fieldName].transform;
        let element = this.arFields[fieldName].element;


        switch (transform) {
            case MongoMorda.TRANSFORM_IPV4_2_LONG:
                switch (operator) {
                    default:
                    case '':
                    case '$eq':
                        if( typeof value === 'object' ) {
                            if( value['$in'] !== undefined ) {
                                return $.map(value['$in'], that.int2ip).join(',');
                            }
                            if( value['$nin'] !== undefined ) {
                                return $.map(value['$nin'], that.int2ip).join(',');
                            }
                        }

                        element.val(that.ip2int(value));
                        break;
                    case '$in':
                        dQuery[fieldName] = {"$in": $.map(value.split(','), that.ip2int)};
                        break;
                }
                break;
            default:
                switch (operator) {

                }
        }
    }

    updateOperatorSelector( field, operator ) {

    }

    resetFieldControls(field) {
        this.arFields[field].element.val('');
    }

    /**
     * Fired when control element changed and text representation of query needs to be updated
     * dQuery then will be parsed into JSON and pasted into input text
     *
     * @param fieldName
     * @param dQuery object holding query typed into text input field
     */
    updateQObject(fieldName, dQuery) {
        let that = this;
        let operator = this.arFields[fieldName].operator;
        let transform = this.arFields[fieldName].transform;
        let value = this.arFields[fieldName].element.val();

        let fnTransform = function (v) { return v; };
        let fnOperator = function (v) { return fnTransform(v); };

        switch (operator) {
            case '$eq':
                fnOperator = function (v) {return fnTransform(v); }
                break;
            case '$gt':
                fnOperator = function (v) {return {"$gt":fnTransform(v)}; }
                break;
            case '$gte':
                fnOperator = function (v) {return {"$gte":fnTransform(v)}; }
                break;
            case '$lt':
                fnOperator = function (v) {return {"$lt":fnTransform(v)}; }
                break;
            case '$lte':
                fnOperator = function (v) {return {"$lte":fnTransform(v)}; }
                break;
            case '$ne':
                fnOperator = function (v) {return {"$ne":fnTransform(v)}; }
                break;
            case '$in':
                fnOperator = function (v) {return {"$in": $.map(value.split(','), fnTransform)}; }
                break;
            case '$nin':
                fnOperator = function (v) {return {"$nin": $.map(value.split(','), fnTransform)}; }
                break;
        }

        switch (transform) {
            case MongoMorda.TRANSFORM_IPV4_2_LONG:
                fnTransform = function (v) { return that.ip2int(v) };
                break;
        }

        dQuery[fieldName] = fnOperator(value);

        return;

        switch (transform) {
            default:
                dQuery[fieldName] = fnOperator(value);
                break;
            case MongoMorda.TRANSFORM_IPV4_2_LONG:
                switch (operator) {
                    default:
                    case '$eq':
                        dQuery[fieldName] = that.ip2int(value);
                        break;
                    case '$in':
                        dQuery[fieldName] = {"$in": $.map(value.split(','), that.ip2int)};
                        break;
                }
                break;
        }

    }

    transformData(q, field, value, toInput) {

        let that = this;

        console.log(this.arFields[field].operator);
        console.log(this.arFields[field].transform);

        switch (this.arFields[field].transform) {
            case 'regex':
                if( toInput === true ) {
                    return value['$regex'];
                }

                q[field] = {"$regex":value};

                if( this.arFields[field].regexOptions !== undefined || this.arFields[field].regexOptions !== null) {
                    q[field]['$options'] = this.arFields[field].regexOptions;
                }

                return;

            case 'exists':
                if( value === true ) {
                    q[field] = {"$exists":true};
                } else {
                    delete q[field];
                }
                break;
            case 'not-null':
                if( toInput === true ) {
                    return value['$regex'];
                }
                if( value === 'false' ) {
                    q[field] = null;
                } else if( value === 'true') {
                    q[field] = {"$ne":null};
                } else {
                    delete q[field];
                }
                break;
            case 'is-null':
                if( value === true ) {
                    q[field] = null;
                } else {
                    delete q[field];
                }
                break;
            case 'ipv4-long':
                if( toInput === true ) {

                    if( typeof value === 'object' ) {
                        if( value['$in'] !== undefined ) {
                            return $.map(value['$in'], that.int2ip).join(',');
                        }
                        if( value['$nin'] !== undefined ) {
                            return $.map(value['$nin'], that.int2ip).join(',');
                        }
                    }
                    return this.int2ip(value);
                }

                switch (this.arFields[field].operator) {
                    default:
                    case '$eq':
                        q[field] = that.ip2int(value);
                        break;
                    case '$ne':
                        q[field] = {"$ne": that.ip2int(value)};
                        break;
                    case '$in':
                        q[field] = {"$in": $.map(value.split(','), that.ip2int)};
                        break;
                    case '$nin':
                        q[field] = {"$nin": $.map(value.split(','), that.ip2int)};
                        break;
                }

                break;
            case 'int':
                if( toInput === true ) {
                    return value;
                }
                q[field] = parseInt(value);
                return;
            case 'string':
            default:
                if( toInput === true ) {
                    return value;
                }
                q[field] = value;
                return;
        }
    }

    bindPredefinedSelector (id) {
        let that = this;
        this.predefinedSelector = $('#'+id);
        this.predefinedSelector.on('change', function (e) {
            that.loadPredefined(e.target.value);
        });
    }

    loadPredefined( q_preDefined ) {
        this.arFields['q'].element.val(q_preDefined);
        this.updateQ('q', q_preDefined);
    }

    int2ip(ipInt) {
        return ((ipInt >>> 24) + '.' + (ipInt >> 16 & 255) + '.' + (ipInt >> 8 & 255) + '.' + (ipInt & 255));
    }

    ip2int(ip) {
        return ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
    }

}