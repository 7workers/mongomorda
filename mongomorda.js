class MongoMorda {
    form;
    arFields = {};
    fieldTemplateContainer;
    addFieldSelector;

    constructor(qElement) {
        this.qElement = qElement;
        let that = this;
        qElement.on('change keyup blur', function (e) {
            that.onQTextInputChange(e.target.value);
        });

        //this.addField('q');
    }

    onQTextInputChange( v ) {
        let that = this;
        try {
            let q = JSON.parse(v);

            $.each(q, function (k, v) {
                if (that.arFields[k] === undefined) {
                    return;
                }
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

    onFieldInputChange(field, value) {
        try {
            let q = JSON.parse(this.qElement.val());

            if (value !== '') {
                this.transformData(q, field, value);
            } else {
                delete q[field];
            }

            this.qElement.val(JSON.stringify(q));
            this.qElement.removeClass('is-invalid');
        } catch (e) {
            console.log(e);
            this.qElement.addClass('is-invalid');
        }
    }

    reload() {
        let that = this;
        let q_string = this.form.find('#q').val();
        try {
            let q = JSON.parse(q_string);


        } catch (e) {
            console.log(e);
            this.form.find('#q').addClass('is-invalid');
        }

    }

    addExtraField() {

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

            that.addField(fieldName, controlElement, controlElement.data('transform'));

            let parentHtml = templateHtml.parent();
            templateHtml.data('isAdded', true);

            if( templateHtml.length === 0 ) {
                console.error('template html not found for ID='+selectedField);
                return;
            }

            let btnRemove = templateHtml.find('button[type=button]');

            if( btnRemove.length === 1 ) {
                btnRemove.on('click',function (e) {
                    that.removeField(fieldName);
                    btnRemove.off();
                    parentHtml.append(templateHtml);
                    templateHtml.data('isAdded', false);
                });
            }
            that.addFieldSelector.parent().before(templateHtml);




            //that.loadPredefined(e.target.value);
        });
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

    addField(name, element, transform, options) {
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
            let value = e.target.value;
            let field = e.target.getAttribute('data-field-name');
            let rawValueJson = e.target.getAttribute('data-raw-value-json');

            console.log(e);

            switch (e.target.type) {
                case 'checkbox':
                    value = e.target.checked;
                    break;
                case 'select-one':
                    let rawJson = e.target.selectedOptions[0].dataset['rawValueJson'];
                    if( rawJson !== undefined ) {
                        value = JSON.parse(rawJson);
                    }
                    break;
            }

            that.onFieldInputChange(field, value);
        });

        that.arFields[name] = {
            element: element,
            transform: transform,
            options: options,
        };

        console.log(that.arFields);
    }

    removeField(name) {
        if( this.arFields[name] === undefined ) {
            throw name + ' field not exists';
        }

        this.arFields[name].element.off();
        delete this.arFields[name];
        this.onFieldInputChange(name,'');
    }

    addField_(fieldId, options) {
        let that = this;

        if( options === undefined )         options = {};
        if( options.type === undefined )    options.type = 'string';

        switch (options.type) {
            case "$regex":
                options.regexOptions = options.regexOptions !== undefined ? options.regexOptions : 'i';
                break;
        }

        options.element = this.form.find('#' + fieldId.replace(/\./, '\\.'));

        that.arFields[fieldId] = options;
        that.arFields[fieldId].element.on();

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
/*
                    switch (that.arFields[k].transform) {
                        case 'ipv4/long':
                            that.arFields[k].element.val(that.int2ip(v));
                            break;
                        case '$regex':
                            that.arFields[k].element.val(v['$regex']);
                            break;
                        case 'string':
                        default:
                            that.arFields[k].element.val(v);
                            break;
                    }
*/
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

    transformData(q, field, value, toInput) {
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
                    return this.int2ip(value);
                }
                q[field] = this.ip2int(value);
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

    setQ__regex(q, value) {

    }

    setField__regex(value) {

    }

    int2ip (ipInt) {
        return ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );
    }

    ip2int(ip) {
        return ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
    }

}