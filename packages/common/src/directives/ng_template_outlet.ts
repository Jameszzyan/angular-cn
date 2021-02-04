/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, EmbeddedViewRef, Input, OnChanges, SimpleChange, SimpleChanges, TemplateRef, ViewContainerRef} from '@angular/core';

/**
 * @ngModule CommonModule
 *
 * @description
 *
 * Inserts an embedded view from a prepared `TemplateRef`.
 *
 * 根据一个提前备好的 `TemplateRef` 插入一个内嵌视图。
 *
 * You can attach a context object to the `EmbeddedViewRef` by setting `[ngTemplateOutletContext]`.
 * `[ngTemplateOutletContext]` should be an object, the object's keys will be available for binding
 * by the local template `let` declarations.
 *
 * 你可以通过设置 `[ngTemplateOutletContext]` 来给 `EmbeddedViewRef` 附加一个上下文对象。
 * `[ngTemplateOutletContext]` 是一个对象，该对象的 key 可在模板中使用 `let` 语句进行绑定。
 *
 * @usageNotes
 *
 * ```
 * <ng-container *ngTemplateOutlet="templateRefExp; context: contextExp"></ng-container>
 * ```
 *
 * Using the key `$implicit` in the context object will set its value as default.
 *
 * 在上下文对象中使用 `$implicit` 这个 key 会把对应的值设置为默认值。
 *
 * ### Example
 *
 * ### 例子
 *
 * {@example common/ngTemplateOutlet/ts/module.ts region='NgTemplateOutlet'}
 *
 * @publicApi
 */
@Directive({selector: '[ngTemplateOutlet]'})
export class NgTemplateOutlet implements OnChanges {
  private _viewRef: EmbeddedViewRef<any>|null = null;

  /**
   * A context object to attach to the {@link EmbeddedViewRef}. This should be an
   * object, the object's keys will be available for binding by the local template `let`
   * declarations.
   * Using the key `$implicit` in the context object will set its value as default.
   *
   * 附加到 {@link EmbeddedViewRef} 的上下文对象。这应该是一个对象，该对象的键名将可以在局部模板中使用 `let` 声明中进行绑定。在上下文对象中使用 `$implicit` 为键名时，将把它作为默认值。
   *
   */
  @Input() public ngTemplateOutletContext: Object|null = null;

  /**
   * A string defining the template reference and optionally the context object for the template.
   *
   * 一个字符串，用于定义模板引用以及模板的上下文对象。
   *
   */
  @Input() public ngTemplateOutlet: TemplateRef<any>|null = null;

  constructor(private _viewContainerRef: ViewContainerRef) {}

  ngOnChanges(changes: SimpleChanges) {
    const recreateView = this._shouldRecreateView(changes);

    if (recreateView) {
      const viewContainerRef = this._viewContainerRef;

      if (this._viewRef) {
        viewContainerRef.remove(viewContainerRef.indexOf(this._viewRef));
      }

      this._viewRef = this.ngTemplateOutlet ?
          viewContainerRef.createEmbeddedView(this.ngTemplateOutlet, this.ngTemplateOutletContext) :
          null;
    } else if (this._viewRef && this.ngTemplateOutletContext) {
      this._updateExistingContext(this.ngTemplateOutletContext);
    }
  }

  /**
   * We need to re-create existing embedded view if:
   *
   * 在下列情况下，我们要重新创建现存的内嵌视图：
   *
   * - templateRef has changed
   *
   *   templateRef 变化了
   *
   * - context has changes
   *
   *   context 发生了变化
   *
   * We mark context object as changed when the corresponding object
   * shape changes (new properties are added or existing properties are removed).
   * In other words we consider context with the same properties as "the same" even
   * if object reference changes (see <https://github.com/angular/angular/issues/13407>).
   *
   * 当相应的对象的形态（而不是值）发生变化时，我们就会把上下文对象标记为已更改（添加了新的属性或移除了现有属性）。
   * 换句话说，即使对象的引用发生了变化，我们也会把具有相同属性的上下文对象视作 "相同的"（参见 <https://github.com/angular/angular/issues/13407>）。
   */
  private _shouldRecreateView(changes: SimpleChanges): boolean {
    const ctxChange = changes['ngTemplateOutletContext'];
    return !!changes['ngTemplateOutlet'] || (ctxChange && this._hasContextShapeChanged(ctxChange));
  }

  private _hasContextShapeChanged(ctxChange: SimpleChange): boolean {
    const prevCtxKeys = Object.keys(ctxChange.previousValue || {});
    const currCtxKeys = Object.keys(ctxChange.currentValue || {});

    if (prevCtxKeys.length === currCtxKeys.length) {
      for (let propName of currCtxKeys) {
        if (prevCtxKeys.indexOf(propName) === -1) {
          return true;
        }
      }
      return false;
    }
    return true;
  }

  private _updateExistingContext(ctx: Object): void {
    for (let propName of Object.keys(ctx)) {
      (<any>this._viewRef!.context)[propName] = (<any>this.ngTemplateOutletContext)[propName];
    }
  }
}
