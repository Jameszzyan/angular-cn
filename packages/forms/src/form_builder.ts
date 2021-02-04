/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';

import {AsyncValidatorFn, ValidatorFn} from './directives/validators';
import {AbstractControl, AbstractControlOptions, FormArray, FormControl, FormGroup, FormHooks} from './model';

function isAbstractControlOptions(options: AbstractControlOptions|
                                  {[key: string]: any}): options is AbstractControlOptions {
  return (<AbstractControlOptions>options).asyncValidators !== undefined ||
      (<AbstractControlOptions>options).validators !== undefined ||
      (<AbstractControlOptions>options).updateOn !== undefined;
}

/**
 * @description
 * Creates an `AbstractControl` from a user-specified configuration.
 *
 * 使用用户指定的配置创建 `AbstractControl`。
 *
 * The `FormBuilder` provides syntactic sugar that shortens creating instances of a `FormControl`,
 * `FormGroup`, or `FormArray`. It reduces the amount of boilerplate needed to build complex
 * forms.
 *
 * `FormBuilder` 提供了一个语法糖，以简化 `FormControl`、`FormGroup` 或 `FormArray` 实例的创建过程。
 * 它会减少构建复杂表单时所需的样板代码的数量。
 *
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 *
 * [响应式表单](/guide/reactive-forms)
 *
 * @publicApi
 */
@Injectable()
export class FormBuilder {
  /**
   * @description
   * Construct a new `FormGroup` instance.
   *
   * 构建一个新的 `FormGroup` 实例。
   * @param controlsConfig A collection of child controls. The key for each child is the name
   * under which it is registered.
   *
   * 一组子控件。每个 key 就是注册进来的控件的名字。
   * @param options Configuration options object for the `FormGroup`. The object should have the
   * the `AbstractControlOptions` type and might contain the following fields:
   *
   * `FormGroup` 的配置项对象。该对象为 `AbstractControlOptions` 类型，并可能包含下列字段：
   *
   * - `validators`: A synchronous validator function, or an array of validator functions
   *
   *   `validators`：一个同步验证器函数或其数组
   *
   * - `asyncValidators`: A single async validator or array of async validator functions
   *
   *   `asyncValidators`：一个异步验证器函数或其数组
   *
   * - `updateOn`: The event upon which the control should be updated (options: 'change' | 'blur' |
   *   submit')
   *
   *     `updateOn` ：控件应更新的事件（选项： 'change' | 'blur' | submit'）
   */
  group(
      controlsConfig: {[key: string]: any},
      options?: AbstractControlOptions|null,
      ): FormGroup;
  /**
   * @description
   * Construct a new `FormGroup` instance.
   *
   * 构造一个新的 `FormGroup` 实例。
   * @deprecated This api is not typesafe and can result in issues with Closure Compiler renaming.
   *  Use the `FormBuilder#group` overload with `AbstractControlOptions` instead.
   *
   * 此 api 不是类型安全的，可能会导致 Closure Compiler 重命名时出现问题。应该改用 `FormBuilder#group` 的接受 `AbstractControlOptions` 的重载形式。
   * @param controlsConfig A collection of child controls. The key for each child is the name
   * under which it is registered.
   *
   * 子控件的集合。每个子控件的键就是其注册名称。
   * @param options Configuration options object for the `FormGroup`. The legacy configuration
   * object consists of:
   *
   * `FormGroup` 配置选项对象。旧的配置对象包括：
   *
   * - `validator`: A synchronous validator function, or an array of validator functions
   *
   *   `validator`：一个同步验证器函数或其数组
   *
   * - `asyncValidator`: A single async validator or array of async validator functions
   *   Note: the legacy format is deprecated and might be removed in one of the next major versions
   *   of Angular.
   *
   *     `asyncValidator` ：单个异步验证器或异步验证器函数数组。注意：不推荐使用旧格式，并且会在 Angular 的后面的某个主要版本中将其删除。
   */
  group(
      controlsConfig: {[key: string]: any},
      options: {[key: string]: any},
      ): FormGroup;
  group(
      controlsConfig: {[key: string]: any},
      options: AbstractControlOptions|{[key: string]: any}|null = null): FormGroup {
    const controls = this._reduceControls(controlsConfig);

    let validators: ValidatorFn|ValidatorFn[]|null = null;
    let asyncValidators: AsyncValidatorFn|AsyncValidatorFn[]|null = null;
    let updateOn: FormHooks|undefined = undefined;

    if (options != null) {
      if (isAbstractControlOptions(options)) {
        // `options` are `AbstractControlOptions`
        validators = options.validators != null ? options.validators : null;
        asyncValidators = options.asyncValidators != null ? options.asyncValidators : null;
        updateOn = options.updateOn != null ? options.updateOn : undefined;
      } else {
        // `options` are legacy form group options
        validators = options['validator'] != null ? options['validator'] : null;
        asyncValidators = options['asyncValidator'] != null ? options['asyncValidator'] : null;
      }
    }

    return new FormGroup(controls, {asyncValidators, updateOn, validators});
  }

  /**
   * @description
   * Construct a new `FormControl` with the given state, validators and options.
   *
   * 构建一个新的 `FormControl` 实例。
   *
   * @param formState Initializes the control with an initial state value, or
   * with an object that contains both a value and a disabled status.
   *
   * 使用一个初始值或一个定义了初始值和禁用状态的对象初始化该控件。
   *
   * @param validatorOrOpts A synchronous validator function, or an array of
   * such functions, or an `AbstractControlOptions` object that contains
   * validation functions and a validation trigger.
   *
   * 一个同步验证器函数或其数组，或者一个包含验证器函数和验证触发器的 `AbstractControlOptions` 对象。
   *
   * @param asyncValidator A single async validator or array of async validator
   * functions.
   *
   * 一个异步验证器函数或其数组。
   *
   * @usageNotes
   *
   * ### Initialize a control as disabled
   *
   * ### 把控件初始化为禁用状态
   *
   * The following example returns a control with an initial value in a disabled state.
   *
   * 下面的例子返回一个带有初始值并已禁用的控件。
   *
   * <code-example path="forms/ts/formBuilder/form_builder_example.ts" region="disabled-control">
   * </code-example>
   */
  control(
      formState: any, validatorOrOpts?: ValidatorFn|ValidatorFn[]|AbstractControlOptions|null,
      asyncValidator?: AsyncValidatorFn|AsyncValidatorFn[]|null): FormControl {
    return new FormControl(formState, validatorOrOpts, asyncValidator);
  }

  /**
   * Constructs a new `FormArray` from the given array of configurations,
   * validators and options.
   *
   * 构造一个新的 `FormArray` 实例。
   *
   * @param controlsConfig An array of child controls or control configs. Each
   * child control is given an index when it is registered.
   *
   * 一个子控件数组。每个子控件的 key 都是它在数组中的索引。
   *
   * @param validatorOrOpts A synchronous validator function, or an array of
   * such functions, or an `AbstractControlOptions` object that contains
   * validation functions and a validation trigger.
   *
   * 一个同步验证器函数或其数组，或者一个包含验证器函数和验证触发器的 `AbstractControlOptions` 对象。
   *
   * @param asyncValidator A single async validator or array of async validator
   * functions.
   *
   * 一个异步验证器函数或其数组。
   */
  array(
      controlsConfig: any[],
      validatorOrOpts?: ValidatorFn|ValidatorFn[]|AbstractControlOptions|null,
      asyncValidator?: AsyncValidatorFn|AsyncValidatorFn[]|null): FormArray {
    const controls = controlsConfig.map(c => this._createControl(c));
    return new FormArray(controls, validatorOrOpts, asyncValidator);
  }

  /** @internal */
  _reduceControls(controlsConfig: {[k: string]: any}): {[key: string]: AbstractControl} {
    const controls: {[key: string]: AbstractControl} = {};
    Object.keys(controlsConfig).forEach(controlName => {
      controls[controlName] = this._createControl(controlsConfig[controlName]);
    });
    return controls;
  }

  /** @internal */
  _createControl(controlConfig: any): AbstractControl {
    if (controlConfig instanceof FormControl || controlConfig instanceof FormGroup ||
        controlConfig instanceof FormArray) {
      return controlConfig;

    } else if (Array.isArray(controlConfig)) {
      const value = controlConfig[0];
      const validator: ValidatorFn = controlConfig.length > 1 ? controlConfig[1] : null;
      const asyncValidator: AsyncValidatorFn = controlConfig.length > 2 ? controlConfig[2] : null;
      return this.control(value, validator, asyncValidator);

    } else {
      return this.control(controlConfig);
    }
  }
}
