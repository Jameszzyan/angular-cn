/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Directive, DoCheck, ElementRef, Input, IterableChanges, IterableDiffer, IterableDiffers, KeyValueChanges, KeyValueDiffer, KeyValueDiffers, Renderer2, ɵisListLikeIterable as isListLikeIterable, ɵstringify as stringify} from '@angular/core';

type NgClassSupportedTypes = string[]|Set<string>|{[klass: string]: any}|null|undefined;

/**
 * @ngModule CommonModule
 *
 * @usageNotes
 *
 * ```
 *     <some-element [ngClass]="'first second'">...</some-element>
 *
 *     <some-element [ngClass]="['first', 'second']">...</some-element>
 *
 *     <some-element [ngClass]="{'first': true, 'second': true, 'third': false}">...</some-element>
 *
 *     <some-element [ngClass]="stringExp|arrayExp|objExp">...</some-element>
 *
 *     <some-element [ngClass]="{'class1 class2 class3' : true}">...</some-element>
 * ```
 *
 * @description
 *
 * Adds and removes CSS classes on an HTML element.
 *
 * 从 HTML 元素上添加和移除 CSS 类。
 *
 * The CSS classes are updated as follows, depending on the type of the expression evaluation:
 *
 * CSS 类会根据表达式求值结果进行更新，更新逻辑取决于结果的类型：
 *
 * - `string` - the CSS classes listed in the string (space delimited) are added,
 *
 *   `string` - 会把列在字符串中的 CSS 类（空格分隔）添加进来，
 *
 * - `Array` - the CSS classes declared as Array elements are added,
 *
 *   `Array` - 会把数组中的各个元素作为 CSS 类添加进来，
 *
 * - `Object` - keys are CSS classes that get added when the expression given in the value
 *              evaluates to a truthy value, otherwise they are removed.
 *
 *   `Object` - 每个 key 都是要处理的 CSS 类，当表达式求值为真的时候则添加，为假则移除。
 *
 * @publicApi
 */
@Directive({selector: '[ngClass]'})
export class NgClass implements DoCheck {
  private _iterableDiffer: IterableDiffer<string>|null = null;
  private _keyValueDiffer: KeyValueDiffer<string, any>|null = null;
  private _initialClasses: string[] = [];
  private _rawClass: NgClassSupportedTypes = null;

  constructor(
      private _iterableDiffers: IterableDiffers, private _keyValueDiffers: KeyValueDiffers,
      private _ngEl: ElementRef, private _renderer: Renderer2) {}


  @Input('class')
  set klass(value: string) {
    this._removeClasses(this._initialClasses);
    this._initialClasses = typeof value === 'string' ? value.split(/\s+/) : [];
    this._applyClasses(this._initialClasses);
    this._applyClasses(this._rawClass);
  }

  @Input('ngClass')
  set ngClass(value: string|string[]|Set<string>|{[klass: string]: any}) {
    this._removeClasses(this._rawClass);
    this._applyClasses(this._initialClasses);

    this._iterableDiffer = null;
    this._keyValueDiffer = null;

    this._rawClass = typeof value === 'string' ? value.split(/\s+/) : value;

    if (this._rawClass) {
      if (isListLikeIterable(this._rawClass)) {
        this._iterableDiffer = this._iterableDiffers.find(this._rawClass).create();
      } else {
        this._keyValueDiffer = this._keyValueDiffers.find(this._rawClass).create();
      }
    }
  }

  ngDoCheck() {
    if (this._iterableDiffer) {
      const iterableChanges = this._iterableDiffer.diff(this._rawClass as string[]);
      if (iterableChanges) {
        this._applyIterableChanges(iterableChanges);
      }
    } else if (this._keyValueDiffer) {
      const keyValueChanges = this._keyValueDiffer.diff(this._rawClass as {[k: string]: any});
      if (keyValueChanges) {
        this._applyKeyValueChanges(keyValueChanges);
      }
    }
  }

  private _applyKeyValueChanges(changes: KeyValueChanges<string, any>): void {
    changes.forEachAddedItem((record) => this._toggleClass(record.key, record.currentValue));
    changes.forEachChangedItem((record) => this._toggleClass(record.key, record.currentValue));
    changes.forEachRemovedItem((record) => {
      if (record.previousValue) {
        this._toggleClass(record.key, false);
      }
    });
  }

  private _applyIterableChanges(changes: IterableChanges<string>): void {
    changes.forEachAddedItem((record) => {
      if (typeof record.item === 'string') {
        this._toggleClass(record.item, true);
      } else {
        throw new Error(`NgClass can only toggle CSS classes expressed as strings, got ${
            stringify(record.item)}`);
      }
    });

    changes.forEachRemovedItem((record) => this._toggleClass(record.item, false));
  }

  /**
   * Applies a collection of CSS classes to the DOM element.
   *
   * 将 CSS 类的集合应用于 DOM 元素。
   *
   * For argument of type Set and Array CSS class names contained in those collections are always
   * added.
   * For argument of type Map CSS class name in the map's key is toggled based on the value (added
   * for truthy and removed for falsy).
   *
   * 对于 Set 和 Array 类型的参数，总是添加那些集合中包含的 CSS 类名称。对于 Map 类型的参数，与映射表中的键名对应的 CSS 类名称会根据该值进行切换（为 true 添加，为 falsy 删除）。
   *
   */
  private _applyClasses(rawClassVal: NgClassSupportedTypes) {
    if (rawClassVal) {
      if (Array.isArray(rawClassVal) || rawClassVal instanceof Set) {
        (<any>rawClassVal).forEach((klass: string) => this._toggleClass(klass, true));
      } else {
        Object.keys(rawClassVal).forEach(klass => this._toggleClass(klass, !!rawClassVal[klass]));
      }
    }
  }

  /**
   * Removes a collection of CSS classes from the DOM element. This is mostly useful for cleanup
   * purposes.
   *
   * 从 DOM 元素中删除 CSS 类的集合。这主要用于清理目的。
   *
   */
  private _removeClasses(rawClassVal: NgClassSupportedTypes) {
    if (rawClassVal) {
      if (Array.isArray(rawClassVal) || rawClassVal instanceof Set) {
        (<any>rawClassVal).forEach((klass: string) => this._toggleClass(klass, false));
      } else {
        Object.keys(rawClassVal).forEach(klass => this._toggleClass(klass, false));
      }
    }
  }

  private _toggleClass(klass: string, enabled: boolean): void {
    klass = klass.trim();
    if (klass) {
      klass.split(/\s+/g).forEach(klass => {
        if (enabled) {
          this._renderer.addClass(this._ngEl.nativeElement, klass);
        } else {
          this._renderer.removeClass(this._ngEl.nativeElement, klass);
        }
      });
    }
  }
}
