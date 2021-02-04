/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, forwardRef, Input, OnChanges, SimpleChanges, StaticProvider} from '@angular/core';
import {Observable} from 'rxjs';

import {AbstractControl} from '../model';
import {NG_VALIDATORS, Validators} from '../validators';


/**
 * @description
 * Defines the map of errors returned from failed validation checks.
 *
 * 定义从失败的验证检查返回的错误映射表。
 *
 * @publicApi
 */
export type ValidationErrors = {
  [key: string]: any
};

/**
 * @description
 * An interface implemented by classes that perform synchronous validation.
 *
 * 一个接口，实现了它的类可以扮演验证器的角色。
 *
 * @usageNotes
 *
 * ### Provide a custom validator
 *
 * ### 提供一个自定义的验证器
 *
 * The following example implements the `Validator` interface to create a
 * validator directive with a custom error key.
 *
 * 下面的例子实现了 `Validator` 接口，以便用一个自定义的错误键来创建验证器指令。
 *
 * ```typescript
 *
 * ```
 * @Directive ({
 *   selector: '[customValidator]',
 *   providers: [{provide: NG_VALIDATORS, useExisting: CustomValidatorDirective, multi: true}]
 * })
 * class CustomValidatorDirective implements Validator {
 *   validate(control: AbstractControl): ValidationErrors|null {
 *     return {'custom': true};
 *   }
 * }
 * ```
 * @publicApi
 */
export interface Validator {
  /**
   * @description
   * Method that performs synchronous validation against the provided control.
   *
   * 对所提供的控件执行同步验证的方法。
   *
   * @param control The control to validate against.
   *
   * 要验证的控件。
   *
   * @returns A map of validation errors if validation fails,
   * otherwise null.
   *
   * 如果验证失败，则验证错误的映射表，否则为 null。
   *
   */
  validate(control: AbstractControl): ValidationErrors|null;

  /**
   * @description
   * Registers a callback function to call when the validator inputs change.
   *
   * 注册一个回调函数以在验证器的输入发生更改时调用。
   *
   * @param fn The callback function
   *
   * 回调函数
   *
   */
  registerOnValidatorChange?(fn: () => void): void;
}

/**
 * @description
 * An interface implemented by classes that perform asynchronous validation.
 *
 * 由执行异步验证的类实现的接口。
 *
 * @usageNotes
 *
 * ### Provide a custom async validator directive
 *
 * ### 提供自定义异步验证程序指令
 *
 * The following example implements the `AsyncValidator` interface to create an
 * async validator directive with a custom error key.
 *
 * 以下示例实现 `AsyncValidator` 接口，以使用自定义错误键名创建异步验证程序指令。
 *
 * ```typescript
 * import { of } from 'rxjs';
 * ```
 * @Directive ({
 *   selector: '[customAsyncValidator]',
 *   providers: [{provide: NG_ASYNC_VALIDATORS, useExisting: CustomAsyncValidatorDirective, multi:
 * true}]
 * })
 * class CustomAsyncValidatorDirective implements AsyncValidator {
 *   validate(control: AbstractControl): Observable<ValidationErrors|null> {
 *     return of({'custom': true});
 *   }
 * }
 * ```
 * @publicApi
 */
export interface AsyncValidator extends Validator {
  /**
   * @description
   * Method that performs async validation against the provided control.
   *
   * 对提供的控件执行异步验证的方法。
   *
   * @param control The control to validate against.
   *
   * 要验证的控件。
   *
   * @returns A promise or observable that resolves a map of validation errors
   * if validation fails, otherwise null.
   *
   * 如果验证失败，则将解决验证错误映射表的 Promise 或 Observable，否则为 null。
   *
   */
  validate(control: AbstractControl):
      Promise<ValidationErrors|null>|Observable<ValidationErrors|null>;
}

/**
 * @description
 * Provider which adds `RequiredValidator` to the `NG_VALIDATORS` multi-provider list.
 */
export const REQUIRED_VALIDATOR: StaticProvider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => RequiredValidator),
  multi: true
};

/**
 * @description
 * Provider which adds `CheckboxRequiredValidator` to the `NG_VALIDATORS` multi-provider list.
 */
export const CHECKBOX_REQUIRED_VALIDATOR: StaticProvider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CheckboxRequiredValidator),
  multi: true
};


/**
 * @description
 * A directive that adds the `required` validator to any controls marked with the
 * `required` attribute. The directive is provided with the `NG_VALIDATORS` multi-provider list.
 *
 * 该指令会借助 `NG_VALIDATORS` 绑定把 `required` 验证器添加到任何带 `required` 属性的控件上。
 *
 * @see [Form Validation](guide/form-validation)
 *
 * [表单验证](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a required validator using template-driven forms
 *
 * ### 使用模板驱动表单添加必填项验证器
 *
 * ```
 * <input name="fullName" ngModel required>
 * ```
 *
 * @ngModule FormsModule
 * @ngModule ReactiveFormsModule
 * @publicApi
 */
@Directive({
  selector:
      ':not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]',
  providers: [REQUIRED_VALIDATOR],
  host: {'[attr.required]': 'required ? "" : null'}
})
export class RequiredValidator implements Validator {
  private _required = false;
  private _onChange?: () => void;

  /**
   * @description
   * Tracks changes to the required attribute bound to this directive.
   *
   * 跟踪对该指令绑定的 required 属性的更改。
   *
   */
  @Input()
  get required(): boolean|string {
    return this._required;
  }

  set required(value: boolean|string) {
    this._required = value != null && value !== false && `${value}` !== 'false';
    if (this._onChange) this._onChange();
  }

  /**
   * Method that validates whether the control is empty.
   * Returns the validation result if enabled, otherwise null.
   *
   * 验证控件是否为空的方法。如果启用，则返回验证结果，否则返回 null。
   *
   * @nodoc
   */
  validate(control: AbstractControl): ValidationErrors|null {
    return this.required ? Validators.required(control) : null;
  }

  /**
   * Registers a callback function to call when the validator inputs change.
   *
   * 注册一个回调函数以在验证器的输入更改时调用。
   *
   * @nodoc
   */
  registerOnValidatorChange(fn: () => void): void {
    this._onChange = fn;
  }
}


/**
 * A Directive that adds the `required` validator to checkbox controls marked with the
 * `required` attribute. The directive is provided with the `NG_VALIDATORS` multi-provider list.
 *
 * 该指令会借助 `NG_VALIDATORS` 绑定把 `required` 验证器添加到任何带有 `required` 属性的检查框控件上。
 *
 * @see [Form Validation](guide/form-validation)
 *
 * [表单验证](guide/form-validation)
 * @usageNotes
 *
 * ### Adding a required checkbox validator using template-driven forms
 *
 * ### 使用模板驱动表单为复选框添加必填项验证器
 *
 * The following example shows how to add a checkbox required validator to an input attached to an\* ngModel binding.
 *
 * 下面的例子展示了如何为一个带有 ngModel 绑定的检查框添加必填项验证器。
 *
 * ```
 * <input type="checkbox" name="active" ngModel required>
 * ```
 * @publicApi
 * @ngModule FormsModule
 * @ngModule ReactiveFormsModule
 */
@Directive({
  selector:
      'input[type=checkbox][required][formControlName],input[type=checkbox][required][formControl],input[type=checkbox][required][ngModel]',
  providers: [CHECKBOX_REQUIRED_VALIDATOR],
  host: {'[attr.required]': 'required ? "" : null'}
})
export class CheckboxRequiredValidator extends RequiredValidator {
  /**
   * Method that validates whether or not the checkbox has been checked.
   * Returns the validation result if enabled, otherwise null.
   *
   * 验证复选框是否已选中的方法。如果启用，则返回验证结果，否则返回 null。
   *
   * @nodoc
   */
  validate(control: AbstractControl): ValidationErrors|null {
    return this.required ? Validators.requiredTrue(control) : null;
  }
}

/**
 * @description
 * Provider which adds `EmailValidator` to the `NG_VALIDATORS` multi-provider list.
 *
 * 该提供者用于把 `EmailValidator` 添加到 `NG_VALIDATORS` 中。
 */
export const EMAIL_VALIDATOR: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => EmailValidator),
  multi: true
};

/**
 * A directive that adds the `email` validator to controls marked with the
 * `email` attribute. The directive is provided with the `NG_VALIDATORS` multi-provider list.
 *
 * 该指令会借助 `NG_VALIDATORS` 绑定把 `email` 验证器添加到任何带有 `email` 属性的控件上。
 *
 * @see [Form Validation](guide/form-validation)
 *
 * [表单验证](guide/form-validation)
 * @usageNotes
 *
 * ### Adding an email validator
 *
 * ### 添加 email 验证器
 *
 * The following example shows how to add an email validator to an input attached to an ngModel\* binding.
 *
 * 下面的例子演示了如何为一个带有 ngModel 绑定的输入框添加 email 验证器。
 *
 * ```
 * <input type="email" name="email" ngModel email>
 * <input type="email" name="email" ngModel email="true">
 * <input type="email" name="email" ngModel [email]="true">
 * ```
 * @publicApi
 * @ngModule FormsModule
 * @ngModule ReactiveFormsModule
 */
@Directive({
  selector: '[email][formControlName],[email][formControl],[email][ngModel]',
  providers: [EMAIL_VALIDATOR]
})
export class EmailValidator implements Validator {
  private _enabled = false;
  private _onChange?: () => void;

  /**
   * @description
   * Tracks changes to the email attribute bound to this directive.
   *
   * 跟踪绑定到该指令的 email 属性的更改。
   *
   */
  @Input()
  set email(value: boolean|string) {
    this._enabled = value === '' || value === true || value === 'true';
    if (this._onChange) this._onChange();
  }

  /**
   * Method that validates whether an email address is valid.
   * Returns the validation result if enabled, otherwise null.
   *
   * 验证 email 地址是否有效的方法。如果启用，则返回验证结果，否则返回 null。
   *
   * @nodoc
   */
  validate(control: AbstractControl): ValidationErrors|null {
    return this._enabled ? Validators.email(control) : null;
  }

  /**
   * Registers a callback function to call when the validator inputs change.
   *
   * 注册一个回调函数以在验证器的输入发生更改时调用。
   *
   * @nodoc
   */
  registerOnValidatorChange(fn: () => void): void {
    this._onChange = fn;
  }
}

/**
 * @description
 * A function that receives a control and synchronously returns a map of
 * validation errors if present, otherwise null.
 *
 * 本函数接收控件并同步返回验证错误的映射表（如果存在），否则返回 null。
 *
 * @publicApi
 */
export interface ValidatorFn {
  (control: AbstractControl): ValidationErrors|null;
}

/**
 * @description
 * A function that receives a control and returns a Promise or observable
 * that emits validation errors if present, otherwise null.
 *
 * 本函数接收控件并返回 Promise 或 Observable，如果存在，则该函数会发出验证错误，否则为 null。
 *
 * @publicApi
 */
export interface AsyncValidatorFn {
  (control: AbstractControl): Promise<ValidationErrors|null>|Observable<ValidationErrors|null>;
}

/**
 * @description
 * Provider which adds `MinLengthValidator` to the `NG_VALIDATORS` multi-provider list.
 *
 * 一个提供者，用于把 `MinLengthValidator` 添加到 `NG_VALIDATORS` 多重提供者列表中。
 */
export const MIN_LENGTH_VALIDATOR: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MinLengthValidator),
  multi: true
};

/**
 * A directive that adds minimum length validation to controls marked with the
 * `minlength` attribute. The directive is provided with the `NG_VALIDATORS` multi-provider list.
 *
 * 该指令用于为带有 `minlength` 属性的控件添加最小长度验证器。该指令会提供 `NG_VALIDATORS` 多重提供者列表。
 *
 * @see [Form Validation](guide/form-validation)
 *
 * [表单验证](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a minimum length validator
 *
 * ### 添加最小长度验证器
 *
 * The following example shows how to add a minimum length validator to an input attached to an
 * ngModel binding.
 *
 * 下面的例子演示了如何为带有 ngModel 绑定的输入框添加最小长度验证器。
 *
 * ```html
 * <input name="firstName" ngModel minlength="4">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector: '[minlength][formControlName],[minlength][formControl],[minlength][ngModel]',
  providers: [MIN_LENGTH_VALIDATOR],
  host: {'[attr.minlength]': 'minlength ? minlength : null'}
})
export class MinLengthValidator implements Validator, OnChanges {
  private _validator: ValidatorFn = Validators.nullValidator;
  private _onChange?: () => void;

  /**
   * @description
   * Tracks changes to the the minimum length bound to this directive.
   *
   * 跟踪与此指令绑定的最小长度的更改。
   *
   */
  @Input()
  minlength!: string|number;  // This input is always defined, since the name matches selector.

  /** @nodoc */
  ngOnChanges(changes: SimpleChanges): void {
    if ('minlength' in changes) {
      this._createValidator();
      if (this._onChange) this._onChange();
    }
  }

  /**
   * Method that validates whether the value meets a minimum length requirement.
   * Returns the validation result if enabled, otherwise null.
   *
   * 验证值是否满足最小长度要求的方法。如果启用，则返回验证结果，否则返回 null。
   *
   * @nodoc
   */
  validate(control: AbstractControl): ValidationErrors|null {
    return this.minlength == null ? null : this._validator(control);
  }

  /**
   * Registers a callback function to call when the validator inputs change.
   *
   * 注册一个回调函数以在验证器的输入发生更改时调用。
   *
   * @nodoc
   */
  registerOnValidatorChange(fn: () => void): void {
    this._onChange = fn;
  }

  private _createValidator(): void {
    this._validator = Validators.minLength(
        typeof this.minlength === 'number' ? this.minlength : parseInt(this.minlength, 10));
  }
}

/**
 * @description
 * Provider which adds `MaxLengthValidator` to the `NG_VALIDATORS` multi-provider list.
 *
 * 一个提供者，用于把 `MaxLengthValidator` 添加到 `NG_VALIDATORS` 多重提供者列表中。
 *
 */
export const MAX_LENGTH_VALIDATOR: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MaxLengthValidator),
  multi: true
};

/**
 * A directive that adds max length validation to controls marked with the
 * `maxlength` attribute. The directive is provided with the `NG_VALIDATORS` multi-provider list.
 *
 * 该指令用于为带有 `maxlength` 属性的控件添加最大长度验证器。该指令会提供 `NG_VALIDATORS` 多重提供者列表。
 *
 * @see [Form Validation](guide/form-validation)
 *
 * [表单验证](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a maximum length validator
 *
 * ### 添加最大长度验证器
 *
 * The following example shows how to add a maximum length validator to an input attached to an
 * ngModel binding.
 *
 * 下面的例子演示了如何为一个带有 ngModel 绑定的输入框添加最大长度验证器。
 *
 * ```html
 * <input name="firstName" ngModel maxlength="25">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector: '[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]',
  providers: [MAX_LENGTH_VALIDATOR],
  host: {'[attr.maxlength]': 'maxlength ? maxlength : null'}
})
export class MaxLengthValidator implements Validator, OnChanges {
  private _validator: ValidatorFn = Validators.nullValidator;
  private _onChange?: () => void;

  /**
   * @description
   * Tracks changes to the the maximum length bound to this directive.
   *
   * 跟踪与此指令绑定的最大长度的更改。
   *
   */
  @Input()
  maxlength!: string|number;  // This input is always defined, since the name matches selector.

  /** @nodoc */
  ngOnChanges(changes: SimpleChanges): void {
    if ('maxlength' in changes) {
      this._createValidator();
      if (this._onChange) this._onChange();
    }
  }

  /**
   * Method that validates whether the value exceeds the maximum length requirement.
   *
   * 验证值是否超过最大长度要求的方法。
   *
   * @nodoc
   */
  validate(control: AbstractControl): ValidationErrors|null {
    return this.maxlength != null ? this._validator(control) : null;
  }

  /**
   * Registers a callback function to call when the validator inputs change.
   *
   * 注册一个回调函数以在验证器的输入发生更改时调用。
   *
   * @nodoc
   */
  registerOnValidatorChange(fn: () => void): void {
    this._onChange = fn;
  }

  private _createValidator(): void {
    this._validator = Validators.maxLength(
        typeof this.maxlength === 'number' ? this.maxlength : parseInt(this.maxlength, 10));
  }
}

/**
 * @description
 * Provider which adds `PatternValidator` to the `NG_VALIDATORS` multi-provider list.
 */
export const PATTERN_VALIDATOR: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => PatternValidator),
  multi: true
};


/**
 * @description
 * A directive that adds regex pattern validation to controls marked with the
 * `pattern` attribute. The regex must match the entire control value.
 * The directive is provided with the `NG_VALIDATORS` multi-provider list.
 *
 * 该指令会借助 `NG_VALIDATORS` 绑定来把 `pattern` 验证器添加到任何带有 `pattern` 属性的控件上。
 * 它会使用该属性的值作为正则表达式来验证控件的值。
 * 它会遵循 `pattern` 属性的语义，也就是说，该正则表达式必须匹配整个控件值。
 *
 * @see [Form Validation](guide/form-validation)
 *
 * [表单验证](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a pattern validator
 *
 * ### 添加模式（pattern）验证器
 *
 * The following example shows how to add a pattern validator to an input attached to an
 * ngModel binding.
 *
 * 下面的例子演示了如何为一个带有 ngModel 绑定的输入框添加模式验证器。
 *
 * ```html
 * <input name="firstName" ngModel pattern="[a-zA-Z ]*">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector: '[pattern][formControlName],[pattern][formControl],[pattern][ngModel]',
  providers: [PATTERN_VALIDATOR],
  host: {'[attr.pattern]': 'pattern ? pattern : null'}
})
export class PatternValidator implements Validator, OnChanges {
  private _validator: ValidatorFn = Validators.nullValidator;
  private _onChange?: () => void;

  /**
   * @description
   * Tracks changes to the pattern bound to this directive.
   *
   * 跟踪对与此指令绑定的模式（pattern）的更改。
   *
   */
  @Input()
  pattern!: string|RegExp;  // This input is always defined, since the name matches selector.

  /** @nodoc */
  ngOnChanges(changes: SimpleChanges): void {
    if ('pattern' in changes) {
      this._createValidator();
      if (this._onChange) this._onChange();
    }
  }

  /**
   * Method that validates whether the value matches the the pattern requirement.
   *
   * 验证值是否符合模式（pattern）要求的方法。
   *
   * @nodoc
   */
  validate(control: AbstractControl): ValidationErrors|null {
    return this._validator(control);
  }

  /**
   * Registers a callback function to call when the validator inputs change.
   *
   * 注册一个回调函数以便在验证器的输入发生更改时调用。
   *
   * @nodoc
   */
  registerOnValidatorChange(fn: () => void): void {
    this._onChange = fn;
  }

  private _createValidator(): void {
    this._validator = Validators.pattern(this.pattern);
  }
}
