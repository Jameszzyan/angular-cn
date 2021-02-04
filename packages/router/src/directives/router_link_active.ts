/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AfterContentInit, ChangeDetectorRef, ContentChildren, Directive, ElementRef, Input, OnChanges, OnDestroy, Optional, QueryList, Renderer2, SimpleChanges} from '@angular/core';
import {from, of, Subscription} from 'rxjs';
import {mergeAll} from 'rxjs/operators';

import {Event, NavigationEnd} from '../events';
import {Router} from '../router';

import {RouterLink, RouterLinkWithHref} from './router_link';


/**
 *
 * @description
 *
 * Tracks whether the linked route of an element is currently active, and allows you
 * to specify one or more CSS classes to add to the element when the linked route
 * is active.
 *
 * 跟踪元素上的链接路由当前是否处于活动状态，并允许你指定一个或多个 CSS 类，以便在链接路由处于活动状态时添加到该元素。
 *
 * Use this directive to create a visual distinction for elements associated with an active route.
 * For example, the following code highlights the word "Bob" when the the router
 * activates the associated route:
 *
 * 使用此指令为与活动路径关联的元素创建视觉差异。例如，以下代码会在路由器激活关联的路由时突出显示单词 “Bob”：
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive="active-link">Bob</a>
 * ```
 *
 * Whenever the URL is either '/user' or '/user/bob', the "active-link" class is
 * added to the anchor tag. If the URL changes, the class is removed.
 *
 * 当浏览器的当前 url 是 '/user' 或 '/user/bob' 时，就会往 `a` 标签上添加 `active-link` 类；
 * 如果 url 发生了变化，则移除它。
 *
 * You can set more than one class using a space-separated string or an array.
 * For example:
 *
 * 你可以设置一个或多个类，例如：
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive="class1 class2">Bob</a>
 * <a routerLink="/user/bob" [routerLinkActive]="['class1', 'class2']">Bob</a>
 * ```
 *
 * To add the classes only when the URL matches the link exactly, add the option `exact: true`:
 *
 * 你可以通过传入 `exact: true` 来配置 RouterLinkActive。这样，只有当 url 和此链接精确匹配时才会添加这些类。
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:
 * true}">Bob</a>
 * ```
 *
 * To directly check the `isActive` status of the link, assign the `RouterLinkActive`
 * instance to a template variable.
 * For example, the following checks the status without assigning any CSS classes:
 *
 * 要直接检查 `isActive` 状态，请将 `RouterLinkActive` 实例分配给模板变量。例如，以下代码会在不分配任何 CSS 类的情况下检查状态：
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive #rla="routerLinkActive">
 *   Bob {{ rla.isActive ? '(already open)' : ''}}
 * </a>
 * ```
 *
 * You can apply the `RouterLinkActive` directive to an ancestor of linked elements.
 * For example, the following sets the active-link class on the `<div>`  parent tag
 * when the URL is either '/user/jim' or '/user/bob'.
 *
 * 最后，你还可以把 `RouterLinkActive` 指令用在 `RouterLink` 的各级祖先节点上。
 *
 * ```
 * <div routerLinkActive="active-link">
 *   <a routerLink="/user/jim">Jim</a>
 *   <a routerLink="/user/bob">Bob</a>
 * </div>
 * ```
 *
 * @ngModule RouterModule
 *
 * @publicApi
 */
@Directive({
  selector: '[routerLinkActive]',
  exportAs: 'routerLinkActive',
})
export class RouterLinkActive implements OnChanges, OnDestroy, AfterContentInit {
  @ContentChildren(RouterLink, {descendants: true}) links!: QueryList<RouterLink>;
  @ContentChildren(RouterLinkWithHref, {descendants: true})
  linksWithHrefs!: QueryList<RouterLinkWithHref>;

  private classes: string[] = [];
  private routerEventsSubscription: Subscription;
  private linkInputChangesSubscription?: Subscription;
  public readonly isActive: boolean = false;

  @Input() routerLinkActiveOptions: {exact: boolean} = {exact: false};

  constructor(
      private router: Router, private element: ElementRef, private renderer: Renderer2,
      private readonly cdr: ChangeDetectorRef, @Optional() private link?: RouterLink,
      @Optional() private linkWithHref?: RouterLinkWithHref) {
    this.routerEventsSubscription = router.events.subscribe((s: Event) => {
      if (s instanceof NavigationEnd) {
        this.update();
      }
    });
  }

  /** @nodoc */
  ngAfterContentInit(): void {
    // `of(null)` is used to force subscribe body to execute once immediately (like `startWith`).
    from([this.links.changes, this.linksWithHrefs.changes, of(null)])
        .pipe(mergeAll())
        .subscribe(_ => {
          this.update();
          this.subscribeToEachLinkOnChanges();
        });
  }

  private subscribeToEachLinkOnChanges() {
    this.linkInputChangesSubscription?.unsubscribe();
    const allLinkChanges =
        [...this.links.toArray(), ...this.linksWithHrefs.toArray(), this.link, this.linkWithHref]
            .filter((link): link is RouterLink|RouterLinkWithHref => !!link)
            .map(link => link.onChanges);
    this.linkInputChangesSubscription = from(allLinkChanges).pipe(mergeAll()).subscribe(link => {
      if (this.isActive !== this.isLinkActive(this.router)(link)) {
        this.update();
      }
    });
  }

  @Input()
  set routerLinkActive(data: string[]|string) {
    const classes = Array.isArray(data) ? data : data.split(' ');
    this.classes = classes.filter(c => !!c);
  }

  /** @nodoc */
  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }
  /** @nodoc */
  ngOnDestroy(): void {
    this.routerEventsSubscription.unsubscribe();
    this.linkInputChangesSubscription?.unsubscribe();
  }

  private update(): void {
    if (!this.links || !this.linksWithHrefs || !this.router.navigated) return;
    Promise.resolve().then(() => {
      const hasActiveLinks = this.hasActiveLinks();
      if (this.isActive !== hasActiveLinks) {
        (this as any).isActive = hasActiveLinks;
        this.cdr.markForCheck();
        this.classes.forEach((c) => {
          if (hasActiveLinks) {
            this.renderer.addClass(this.element.nativeElement, c);
          } else {
            this.renderer.removeClass(this.element.nativeElement, c);
          }
        });
      }
    });
  }

  private isLinkActive(router: Router): (link: (RouterLink|RouterLinkWithHref)) => boolean {
    return (link: RouterLink|RouterLinkWithHref) =>
               router.isActive(link.urlTree, this.routerLinkActiveOptions.exact);
  }

  private hasActiveLinks(): boolean {
    const isActiveCheckFn = this.isLinkActive(this.router);
    return this.link && isActiveCheckFn(this.link) ||
        this.linkWithHref && isActiveCheckFn(this.linkWithHref) ||
        this.links.some(isActiveCheckFn) || this.linksWithHrefs.some(isActiveCheckFn);
  }
}
