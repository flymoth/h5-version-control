const convertRecursion = Symbol('convertRecursion') //私有方法
const convert = Symbol('convert')
const ifNeedVersionControl = Symbol('ifNeedVersionControl')
const getVersionByRule = Symbol('getVersionByRule')
const checkUserfulInterval = Symbol('checkUserfulInterval')
const versionCompare = Symbol('versionCompare')

export default class VersionControl {
    constructor(version) {
        this.version = version
    }

    /**
     *
     * @param {versino} App版本号
     * @param {lowest} 最低版本号，低于该版本号的不做版本控制
     */
    static init(version) {
        if (!this._instance) this._instance = new VersionControl(version)
        return this._instance
    }

    /**
     *
     * @param {routes} 路由参数
     * {
     *  path:{
     *      versionControl:{
     *          need: Boolean,   //是否需要版本控制
     *          mode: default || pre || old,   //未找到对应版本文件时操作, 默认显示一个版本更新提示页，pre=>最新，old=>最旧
     *      } || Boolean,
     *      ...
     *  }
     * }
     */
    parse(routes) {
        for (let path in routes) {
            const route = routes[path]
            if (this[ifNeedVersionControl](route)) {
                //需要版本控制的页面
                if (route.modules) {
                    this[convertRecursion](route, true) //需递归处理
                } else {
                    this[convert](route) //不需要递归处理
                }
            } else {
                //父路由未设置版本控制参数，子路由设置版本控制参数
                if (route.modules) {
                    this[convertRecursion](route) //需递归处理
                }
            }
        }
        return routes
    }

    /**
     *
     * @param {route} 单路由对象
     */
    [ifNeedVersionControl](route) {
        return (
            route.versionControl ||
            (route.versionControl && route.versionControl.need !== false)
        )
    }
    /**
     *
     * @param {route} 需递归处理的路由
     * @param {inherit} 从父路由继承,
     */
    [convertRecursion]({ modules }, inherit = false) {
        for (let path in modules) {
            const route = modules[path]
            if (inherit && typeof route.versionControl === undefined) {
                if (route.modules) {
                    this[convertRecursion](route, true)
                } else {
                    this[convert](route)
                }
            } else if (this[ifNeedVersionControl](route)) {
                if (route.modules) {
                    this[convertRecursion](route, true)
                } else {
                    this[convert](route)
                }
            }
        }
    }

    /**
     *
     * @param {route} 不需要递归处理的路由
     */
    [convert](route) {
        if (route.path) {
            const matchVersion = this[getVersionByRule](route)
            if (matchVersion !== '*')
                route.path = `${route.path}@${matchVersion}`
        }
    }

    [getVersionByRule](route) {
        if (route.versionControl && route.versionControl.rule) {
            const rule = route.versionControl.rule
            for (let interval in rule) {
                if (this[checkUserfulInterval](interval)) {
                    return rule[interval]
                }
            }
            return '*'
        } else {
            return '*'
        }
    }

    /**
     *
     *
     * @param {string} [v1='']
     * @param {string} [v2='']
     * @returns {Number(1,0,-1)}
     * @memberof VersionControl
     */
    [versionCompare](v1 = '', v2 = '') {
        const v1Arr = v1.split('.')
        const v2Arr = v2.split('.')

        for (let i = 0; i < v1Arr.length; i++) {
            const childV1 = +v1Arr[i]
            const childV2 = +v2Arr[i]
            if (childV1 !== childV2) {
                return childV1 > childV2 ? 1 : -1
            }
        }
        return 0
    }
    /**
     *
     * @param {*} interval
     * 判断这个区间是否是个合法区间，并且该版本是否在这个区间内
     * 强编码、及其脆弱的逻辑判断。。。
     */
    [checkUserfulInterval](interval) {
        if (interval === '*') return true
        const match = interval.match(/(.+)-(.+)/)
        if (!match) return false
        const min = match[1]
        const max = match[2]
        if (min === '*' && max !== '*') return false
        if (
            this[versionCompare](min, this.version) === 1 ||
            (this[versionCompare](max, this.version) === -1 && max !== '*')
        )
            return false
        if (this[versionCompare](min, max) === 1 && max !== '*') return false
        return true
    }
}