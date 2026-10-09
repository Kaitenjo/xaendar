var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../node_modules/vscode-languageserver/lib/common/utils/is.js
var require_is = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/utils/is.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.boolean = boolean;
    exports2.string = string;
    exports2.number = number;
    exports2.error = error;
    exports2.func = func;
    exports2.array = array;
    exports2.stringArray = stringArray;
    exports2.typedArray = typedArray;
    exports2.thenable = thenable;
    function boolean(value) {
      return value === true || value === false;
    }
    function string(value) {
      return typeof value === "string" || value instanceof String;
    }
    function number(value) {
      return typeof value === "number" || value instanceof Number;
    }
    function error(value) {
      return value instanceof Error;
    }
    function func(value) {
      return typeof value === "function";
    }
    function array(value) {
      return Array.isArray(value);
    }
    function stringArray(value) {
      return array(value) && value.every((elem) => string(elem));
    }
    function typedArray(value, check) {
      return Array.isArray(value) && value.every(check);
    }
    function thenable(value) {
      return value && func(value.then);
    }
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/is.js
var require_is2 = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/is.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.boolean = boolean;
    exports2.string = string;
    exports2.number = number;
    exports2.error = error;
    exports2.func = func;
    exports2.array = array;
    exports2.stringArray = stringArray;
    function boolean(value) {
      return value === true || value === false;
    }
    function string(value) {
      return typeof value === "string" || value instanceof String;
    }
    function number(value) {
      return typeof value === "number" || value instanceof Number;
    }
    function error(value) {
      return value instanceof Error;
    }
    function func(value) {
      return typeof value === "function";
    }
    function array(value) {
      return Array.isArray(value);
    }
    function stringArray(value) {
      return array(value) && value.every((elem) => string(elem));
    }
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/messages.js
var require_messages = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/messages.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Message = exports2.NotificationType9 = exports2.NotificationType8 = exports2.NotificationType7 = exports2.NotificationType6 = exports2.NotificationType5 = exports2.NotificationType4 = exports2.NotificationType3 = exports2.NotificationType2 = exports2.NotificationType1 = exports2.NotificationType0 = exports2.NotificationType = exports2.RequestType9 = exports2.RequestType8 = exports2.RequestType7 = exports2.RequestType6 = exports2.RequestType5 = exports2.RequestType4 = exports2.RequestType3 = exports2.RequestType2 = exports2.RequestType1 = exports2.RequestType = exports2.RequestType0 = exports2.AbstractMessageSignature = exports2.ParameterStructures = exports2.ResponseError = exports2.ErrorCodes = void 0;
    var is = __importStar(require_is2());
    var ErrorCodes;
    (function(ErrorCodes2) {
      ErrorCodes2.ParseError = -32700;
      ErrorCodes2.InvalidRequest = -32600;
      ErrorCodes2.MethodNotFound = -32601;
      ErrorCodes2.InvalidParams = -32602;
      ErrorCodes2.InternalError = -32603;
      ErrorCodes2.jsonrpcReservedErrorRangeStart = -32099;
      ErrorCodes2.serverErrorStart = -32099;
      ErrorCodes2.MessageWriteError = -32099;
      ErrorCodes2.MessageReadError = -32098;
      ErrorCodes2.PendingResponseRejected = -32097;
      ErrorCodes2.ConnectionInactive = -32096;
      ErrorCodes2.ServerNotInitialized = -32002;
      ErrorCodes2.UnknownErrorCode = -32001;
      ErrorCodes2.jsonrpcReservedErrorRangeEnd = -32e3;
      ErrorCodes2.serverErrorEnd = -32e3;
    })(ErrorCodes || (exports2.ErrorCodes = ErrorCodes = {}));
    var ResponseError = class _ResponseError extends Error {
      code;
      data;
      constructor(code, message, data) {
        super(message);
        this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
        this.data = data;
        Object.setPrototypeOf(this, _ResponseError.prototype);
      }
      toJson() {
        const result = {
          code: this.code,
          message: this.message
        };
        if (this.data !== void 0) {
          result.data = this.data;
        }
        return result;
      }
    };
    exports2.ResponseError = ResponseError;
    var ParameterStructures = class _ParameterStructures {
      kind;
      /**
       * The parameter structure is automatically inferred on the number of parameters
       * and the parameter type in case of a single param.
       */
      static auto = new _ParameterStructures("auto");
      /**
       * Forces `byPosition` parameter structure. This is useful if you have a single
       * parameter which has a literal type.
       */
      static byPosition = new _ParameterStructures("byPosition");
      /**
       * Forces `byName` parameter structure. This is only useful when having a single
       * parameter. The library will report errors if used with a different number of
       * parameters.
       */
      static byName = new _ParameterStructures("byName");
      constructor(kind) {
        this.kind = kind;
      }
      static is(value) {
        return value === _ParameterStructures.auto || value === _ParameterStructures.byName || value === _ParameterStructures.byPosition;
      }
      toString() {
        return this.kind;
      }
    };
    exports2.ParameterStructures = ParameterStructures;
    var AbstractMessageSignature = class {
      method;
      numberOfParams;
      constructor(method, numberOfParams) {
        this.method = method;
        this.numberOfParams = numberOfParams;
      }
      get parameterStructures() {
        return ParameterStructures.auto;
      }
    };
    exports2.AbstractMessageSignature = AbstractMessageSignature;
    var RequestType0 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 0);
      }
    };
    exports2.RequestType0 = RequestType0;
    var RequestType = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports2.RequestType = RequestType;
    var RequestType1 = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports2.RequestType1 = RequestType1;
    var RequestType2 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 2);
      }
    };
    exports2.RequestType2 = RequestType2;
    var RequestType3 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 3);
      }
    };
    exports2.RequestType3 = RequestType3;
    var RequestType4 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 4);
      }
    };
    exports2.RequestType4 = RequestType4;
    var RequestType5 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 5);
      }
    };
    exports2.RequestType5 = RequestType5;
    var RequestType6 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 6);
      }
    };
    exports2.RequestType6 = RequestType6;
    var RequestType7 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 7);
      }
    };
    exports2.RequestType7 = RequestType7;
    var RequestType8 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 8);
      }
    };
    exports2.RequestType8 = RequestType8;
    var RequestType9 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 9);
      }
    };
    exports2.RequestType9 = RequestType9;
    var NotificationType = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports2.NotificationType = NotificationType;
    var NotificationType0 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 0);
      }
    };
    exports2.NotificationType0 = NotificationType0;
    var NotificationType1 = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports2.NotificationType1 = NotificationType1;
    var NotificationType2 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 2);
      }
    };
    exports2.NotificationType2 = NotificationType2;
    var NotificationType3 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 3);
      }
    };
    exports2.NotificationType3 = NotificationType3;
    var NotificationType4 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 4);
      }
    };
    exports2.NotificationType4 = NotificationType4;
    var NotificationType5 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 5);
      }
    };
    exports2.NotificationType5 = NotificationType5;
    var NotificationType6 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 6);
      }
    };
    exports2.NotificationType6 = NotificationType6;
    var NotificationType7 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 7);
      }
    };
    exports2.NotificationType7 = NotificationType7;
    var NotificationType8 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 8);
      }
    };
    exports2.NotificationType8 = NotificationType8;
    var NotificationType9 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 9);
      }
    };
    exports2.NotificationType9 = NotificationType9;
    var Message;
    (function(Message2) {
      function isRequest(message) {
        const candidate = message;
        return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
      }
      Message2.isRequest = isRequest;
      function isNotification(message) {
        const candidate = message;
        return candidate && is.string(candidate.method) && message.id === void 0;
      }
      Message2.isNotification = isNotification;
      function isResponse(message) {
        const candidate = message;
        return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
      }
      Message2.isResponse = isResponse;
    })(Message || (exports2.Message = Message = {}));
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/linkedMap.js
var require_linkedMap = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/linkedMap.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LRUCache = exports2.LinkedMap = exports2.Touch = void 0;
    var Touch;
    (function(Touch2) {
      Touch2.None = 0;
      Touch2.First = 1;
      Touch2.AsOld = Touch2.First;
      Touch2.Last = 2;
      Touch2.AsNew = Touch2.Last;
    })(Touch || (exports2.Touch = Touch = {}));
    var LinkedMap = class {
      [Symbol.toStringTag] = "LinkedMap";
      _map;
      _head;
      _tail;
      _size;
      _state;
      constructor() {
        this._map = /* @__PURE__ */ new Map();
        this._head = void 0;
        this._tail = void 0;
        this._size = 0;
        this._state = 0;
      }
      clear() {
        this._map.clear();
        this._head = void 0;
        this._tail = void 0;
        this._size = 0;
        this._state++;
      }
      isEmpty() {
        return !this._head && !this._tail;
      }
      get size() {
        return this._size;
      }
      get first() {
        return this._head?.value;
      }
      get last() {
        return this._tail?.value;
      }
      before(key) {
        const item = this._map.get(key);
        return item ? item.previous?.value : void 0;
      }
      after(key) {
        const item = this._map.get(key);
        return item ? item.next?.value : void 0;
      }
      has(key) {
        return this._map.has(key);
      }
      get(key, touch = Touch.None) {
        const item = this._map.get(key);
        if (!item) {
          return void 0;
        }
        if (touch !== Touch.None) {
          this.touch(item, touch);
        }
        return item.value;
      }
      set(key, value, touch = Touch.None) {
        let item = this._map.get(key);
        if (item) {
          item.value = value;
          if (touch !== Touch.None) {
            this.touch(item, touch);
          }
        } else {
          item = { key, value, next: void 0, previous: void 0 };
          switch (touch) {
            case Touch.None:
              this.addItemLast(item);
              break;
            case Touch.First:
              this.addItemFirst(item);
              break;
            case Touch.Last:
              this.addItemLast(item);
              break;
            default:
              this.addItemLast(item);
              break;
          }
          this._map.set(key, item);
          this._size++;
        }
        return this;
      }
      delete(key) {
        return !!this.remove(key);
      }
      remove(key) {
        const item = this._map.get(key);
        if (!item) {
          return void 0;
        }
        this._map.delete(key);
        this.removeItem(item);
        this._size--;
        return item.value;
      }
      shift() {
        if (!this._head && !this._tail) {
          return void 0;
        }
        if (!this._head || !this._tail) {
          throw new Error("Invalid list");
        }
        const item = this._head;
        this._map.delete(item.key);
        this.removeItem(item);
        this._size--;
        return item.value;
      }
      forEach(callbackfn, thisArg) {
        const state = this._state;
        let current = this._head;
        while (current) {
          if (thisArg) {
            callbackfn.bind(thisArg)(current.value, current.key, this);
          } else {
            callbackfn(current.value, current.key, this);
          }
          if (this._state !== state) {
            throw new Error(`LinkedMap got modified during iteration.`);
          }
          current = current.next;
        }
      }
      keys() {
        const state = this._state;
        let current = this._head;
        const iterator = {
          [Symbol.iterator]: () => {
            return iterator;
          },
          next: () => {
            if (this._state !== state) {
              throw new Error(`LinkedMap got modified during iteration.`);
            }
            if (current) {
              const result = { value: current.key, done: false };
              current = current.next;
              return result;
            } else {
              return { value: void 0, done: true };
            }
          }
        };
        return iterator;
      }
      values() {
        const state = this._state;
        let current = this._head;
        const iterator = {
          [Symbol.iterator]: () => {
            return iterator;
          },
          next: () => {
            if (this._state !== state) {
              throw new Error(`LinkedMap got modified during iteration.`);
            }
            if (current) {
              const result = { value: current.value, done: false };
              current = current.next;
              return result;
            } else {
              return { value: void 0, done: true };
            }
          }
        };
        return iterator;
      }
      entries() {
        const state = this._state;
        let current = this._head;
        const iterator = {
          [Symbol.iterator]: () => {
            return iterator;
          },
          next: () => {
            if (this._state !== state) {
              throw new Error(`LinkedMap got modified during iteration.`);
            }
            if (current) {
              const result = { value: [current.key, current.value], done: false };
              current = current.next;
              return result;
            } else {
              return { value: void 0, done: true };
            }
          }
        };
        return iterator;
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      trimOld(newSize) {
        if (newSize >= this.size) {
          return;
        }
        if (newSize === 0) {
          this.clear();
          return;
        }
        let current = this._head;
        let currentSize = this.size;
        while (current && currentSize > newSize) {
          this._map.delete(current.key);
          current = current.next;
          currentSize--;
        }
        this._head = current;
        this._size = currentSize;
        if (current) {
          current.previous = void 0;
        }
        this._state++;
      }
      addItemFirst(item) {
        if (!this._head && !this._tail) {
          this._tail = item;
        } else if (!this._head) {
          throw new Error("Invalid list");
        } else {
          item.next = this._head;
          this._head.previous = item;
        }
        this._head = item;
        this._state++;
      }
      addItemLast(item) {
        if (!this._head && !this._tail) {
          this._head = item;
        } else if (!this._tail) {
          throw new Error("Invalid list");
        } else {
          item.previous = this._tail;
          this._tail.next = item;
        }
        this._tail = item;
        this._state++;
      }
      removeItem(item) {
        if (item === this._head && item === this._tail) {
          this._head = void 0;
          this._tail = void 0;
        } else if (item === this._head) {
          if (!item.next) {
            throw new Error("Invalid list");
          }
          item.next.previous = void 0;
          this._head = item.next;
        } else if (item === this._tail) {
          if (!item.previous) {
            throw new Error("Invalid list");
          }
          item.previous.next = void 0;
          this._tail = item.previous;
        } else {
          const next = item.next;
          const previous = item.previous;
          if (!next || !previous) {
            throw new Error("Invalid list");
          }
          next.previous = previous;
          previous.next = next;
        }
        item.next = void 0;
        item.previous = void 0;
        this._state++;
      }
      touch(item, touch) {
        if (!this._head || !this._tail) {
          throw new Error("Invalid list");
        }
        if (touch !== Touch.First && touch !== Touch.Last) {
          return;
        }
        if (touch === Touch.First) {
          if (item === this._head) {
            return;
          }
          const next = item.next;
          const previous = item.previous;
          if (item === this._tail) {
            previous.next = void 0;
            this._tail = previous;
          } else {
            next.previous = previous;
            previous.next = next;
          }
          item.previous = void 0;
          item.next = this._head;
          this._head.previous = item;
          this._head = item;
          this._state++;
        } else if (touch === Touch.Last) {
          if (item === this._tail) {
            return;
          }
          const next = item.next;
          const previous = item.previous;
          if (item === this._head) {
            next.previous = void 0;
            this._head = next;
          } else {
            next.previous = previous;
            previous.next = next;
          }
          item.next = void 0;
          item.previous = this._tail;
          this._tail.next = item;
          this._tail = item;
          this._state++;
        }
      }
      toJSON() {
        const data = [];
        this.forEach((value, key) => {
          data.push([key, value]);
        });
        return data;
      }
      fromJSON(data) {
        this.clear();
        for (const [key, value] of data) {
          this.set(key, value);
        }
      }
    };
    exports2.LinkedMap = LinkedMap;
    var LRUCache = class extends LinkedMap {
      _limit;
      _ratio;
      constructor(limit, ratio = 1) {
        super();
        this._limit = limit;
        this._ratio = Math.min(Math.max(0, ratio), 1);
      }
      get limit() {
        return this._limit;
      }
      set limit(limit) {
        this._limit = limit;
        this.checkTrim();
      }
      get ratio() {
        return this._ratio;
      }
      set ratio(ratio) {
        this._ratio = Math.min(Math.max(0, ratio), 1);
        this.checkTrim();
      }
      get(key, touch = Touch.AsNew) {
        return super.get(key, touch);
      }
      peek(key) {
        return super.get(key, Touch.None);
      }
      set(key, value) {
        super.set(key, value, Touch.Last);
        this.checkTrim();
        return this;
      }
      checkTrim() {
        if (this.size > this._limit) {
          this.trimOld(Math.round(this._limit * this._ratio));
        }
      }
    };
    exports2.LRUCache = LRUCache;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/disposable.js
var require_disposable = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/disposable.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Disposable = void 0;
    var Disposable;
    (function(Disposable2) {
      function create(func) {
        return {
          dispose: func
        };
      }
      Disposable2.create = create;
    })(Disposable || (exports2.Disposable = Disposable = {}));
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/ral.js
var require_ral = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/ral.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var _ral;
    function RAL() {
      if (_ral === void 0) {
        throw new Error(`No runtime abstraction layer installed`);
      }
      return _ral;
    }
    (function(RAL2) {
      function install(ral) {
        if (ral === void 0) {
          throw new Error(`No runtime abstraction layer provided`);
        }
        _ral = ral;
      }
      RAL2.install = install;
    })(RAL || (RAL = {}));
    exports2.default = RAL;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/events.js
var require_events = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/events.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Emitter = exports2.Event = void 0;
    var ral_1 = __importDefault(require_ral());
    var Event;
    (function(Event2) {
      const _disposable = { dispose() {
      } };
      Event2.None = function() {
        return _disposable;
      };
    })(Event || (exports2.Event = Event = {}));
    var CallbackList = class {
      _callbacks;
      _contexts;
      add(callback, context = null, bucket) {
        if (!this._callbacks) {
          this._callbacks = [];
          this._contexts = [];
        }
        this._callbacks.push(callback);
        this._contexts.push(context);
        if (Array.isArray(bucket)) {
          bucket.push({ dispose: () => this.remove(callback, context) });
        }
      }
      remove(callback, context = null) {
        if (!this._callbacks) {
          return;
        }
        let foundCallbackWithDifferentContext = false;
        for (let i2 = 0, len = this._callbacks.length; i2 < len; i2++) {
          if (this._callbacks[i2] === callback) {
            if (this._contexts[i2] === context) {
              this._callbacks.splice(i2, 1);
              this._contexts.splice(i2, 1);
              return;
            } else {
              foundCallbackWithDifferentContext = true;
            }
          }
        }
        if (foundCallbackWithDifferentContext) {
          throw new Error("When adding a listener with a context, you should remove it with the same context");
        }
      }
      invoke(...args) {
        if (!this._callbacks) {
          return [];
        }
        const ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
        for (let i2 = 0, len = callbacks.length; i2 < len; i2++) {
          try {
            ret.push(callbacks[i2].apply(contexts[i2], args));
          } catch (e2) {
            (0, ral_1.default)().console.error(e2);
          }
        }
        return ret;
      }
      isEmpty() {
        return !this._callbacks || this._callbacks.length === 0;
      }
      dispose() {
        this._callbacks = void 0;
        this._contexts = void 0;
      }
    };
    var Emitter = class _Emitter {
      _options;
      static _noop = function() {
      };
      _event;
      _callbacks;
      constructor(_options) {
        this._options = _options;
      }
      /**
       * For the public to allow to subscribe
       * to events from this Emitter
       */
      get event() {
        if (!this._event) {
          this._event = (listener, thisArgs, disposables) => {
            if (!this._callbacks) {
              this._callbacks = new CallbackList();
            }
            if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) {
              this._options.onFirstListenerAdd(this);
            }
            this._callbacks.add(listener, thisArgs);
            const result = {
              dispose: () => {
                if (!this._callbacks) {
                  return;
                }
                this._callbacks.remove(listener, thisArgs);
                result.dispose = _Emitter._noop;
                if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
                  this._options.onLastListenerRemove(this);
                }
              }
            };
            if (Array.isArray(disposables)) {
              disposables.push(result);
            }
            return result;
          };
        }
        return this._event;
      }
      /**
       * To be kept private to fire an event to
       * subscribers
       */
      fire(event) {
        if (this._callbacks) {
          this._callbacks.invoke.call(this._callbacks, event);
        }
      }
      dispose() {
        if (this._callbacks) {
          this._callbacks.dispose();
          this._callbacks = void 0;
        }
      }
    };
    exports2.Emitter = Emitter;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/cancellation.js
var require_cancellation = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/cancellation.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CancellationTokenSource = exports2.CancellationToken = void 0;
    var ral_1 = __importDefault(require_ral());
    var Is2 = __importStar(require_is2());
    var events_1 = require_events();
    var CancellationToken;
    (function(CancellationToken2) {
      CancellationToken2.None = Object.freeze({
        isCancellationRequested: false,
        onCancellationRequested: events_1.Event.None
      });
      CancellationToken2.Cancelled = Object.freeze({
        isCancellationRequested: true,
        onCancellationRequested: events_1.Event.None
      });
      function is(value) {
        const candidate = value;
        return candidate && (candidate === CancellationToken2.None || candidate === CancellationToken2.Cancelled || Is2.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested);
      }
      CancellationToken2.is = is;
    })(CancellationToken || (exports2.CancellationToken = CancellationToken = {}));
    var shortcutEvent = Object.freeze(function(callback, context) {
      const handle = (0, ral_1.default)().timer.setTimeout(callback.bind(context), 0);
      return { dispose() {
        handle.dispose();
      } };
    });
    var MutableToken = class {
      _isCancelled = false;
      _emitter;
      cancel() {
        if (!this._isCancelled) {
          this._isCancelled = true;
          if (this._emitter) {
            this._emitter.fire(void 0);
            this.dispose();
          }
        }
      }
      get isCancellationRequested() {
        return this._isCancelled;
      }
      get onCancellationRequested() {
        if (this._isCancelled) {
          return shortcutEvent;
        }
        if (!this._emitter) {
          this._emitter = new events_1.Emitter();
        }
        return this._emitter.event;
      }
      dispose() {
        if (this._emitter) {
          this._emitter.dispose();
          this._emitter = void 0;
        }
      }
    };
    var CancellationTokenSource = class {
      _token;
      get token() {
        if (!this._token) {
          this._token = new MutableToken();
        }
        return this._token;
      }
      cancel() {
        if (!this._token) {
          this._token = CancellationToken.Cancelled;
        } else {
          this._token.cancel();
        }
      }
      dispose() {
        if (!this._token) {
          this._token = CancellationToken.None;
        } else if (this._token instanceof MutableToken) {
          this._token.dispose();
        }
      }
    };
    exports2.CancellationTokenSource = CancellationTokenSource;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/sharedArrayCancellation.js
var require_sharedArrayCancellation = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/sharedArrayCancellation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SharedArrayReceiverStrategy = exports2.SharedArraySenderStrategy = void 0;
    var cancellation_1 = require_cancellation();
    var CancellationState;
    (function(CancellationState2) {
      CancellationState2.Continue = 0;
      CancellationState2.Cancelled = 1;
    })(CancellationState || (CancellationState = {}));
    var SharedArraySenderStrategy = class {
      buffers;
      constructor() {
        this.buffers = /* @__PURE__ */ new Map();
      }
      enableCancellation(request) {
        if (request.id === null) {
          return;
        }
        const buffer = new SharedArrayBuffer(4);
        const data = new Int32Array(buffer, 0, 1);
        data[0] = CancellationState.Continue;
        this.buffers.set(request.id, buffer);
        request.$cancellationData = buffer;
      }
      async sendCancellation(_conn, id) {
        const buffer = this.buffers.get(id);
        if (buffer === void 0) {
          return;
        }
        const data = new Int32Array(buffer, 0, 1);
        Atomics.store(data, 0, CancellationState.Cancelled);
      }
      cleanup(id) {
        this.buffers.delete(id);
      }
      dispose() {
        this.buffers.clear();
      }
    };
    exports2.SharedArraySenderStrategy = SharedArraySenderStrategy;
    var SharedArrayBufferCancellationToken = class {
      data;
      constructor(buffer) {
        this.data = new Int32Array(buffer, 0, 1);
      }
      get isCancellationRequested() {
        return Atomics.load(this.data, 0) === CancellationState.Cancelled;
      }
      get onCancellationRequested() {
        throw new Error(`Cancellation over SharedArrayBuffer doesn't support cancellation events`);
      }
    };
    var SharedArrayBufferCancellationTokenSource = class {
      token;
      constructor(buffer) {
        this.token = new SharedArrayBufferCancellationToken(buffer);
      }
      cancel() {
      }
      dispose() {
      }
    };
    var SharedArrayReceiverStrategy = class {
      kind = "request";
      createCancellationTokenSource(request) {
        const buffer = request.$cancellationData;
        if (buffer === void 0) {
          return new cancellation_1.CancellationTokenSource();
        }
        return new SharedArrayBufferCancellationTokenSource(buffer);
      }
    };
    exports2.SharedArrayReceiverStrategy = SharedArrayReceiverStrategy;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/semaphore.js
var require_semaphore = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/semaphore.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Semaphore = void 0;
    var ral_1 = __importDefault(require_ral());
    var Semaphore = class {
      _capacity;
      _active;
      _waiting;
      constructor(capacity = 1) {
        if (capacity <= 0) {
          throw new Error("Capacity must be greater than 0");
        }
        this._capacity = capacity;
        this._active = 0;
        this._waiting = [];
      }
      lock(thunk) {
        return new Promise((resolve2, reject) => {
          this._waiting.push({ thunk, resolve: resolve2, reject });
          this.runNext();
        });
      }
      get active() {
        return this._active;
      }
      runNext() {
        if (this._waiting.length === 0 || this._active === this._capacity) {
          return;
        }
        (0, ral_1.default)().timer.setImmediate(() => this.doRunNext());
      }
      doRunNext() {
        if (this._waiting.length === 0 || this._active === this._capacity) {
          return;
        }
        const next = this._waiting.shift();
        this._active++;
        if (this._active > this._capacity) {
          throw new Error(`Too many thunks active`);
        }
        try {
          const result = next.thunk();
          if (result instanceof Promise) {
            result.then((value) => {
              this._active--;
              next.resolve(value);
              this.runNext();
            }, (err) => {
              this._active--;
              next.reject(err);
              this.runNext();
            });
          } else {
            this._active--;
            next.resolve(result);
            this.runNext();
          }
        } catch (err) {
          this._active--;
          next.reject(err);
          this.runNext();
        }
      }
    };
    exports2.Semaphore = Semaphore;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/messageReader.js
var require_messageReader = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/messageReader.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ReadableStreamMessageReader = exports2.AbstractMessageReader = exports2.MessageReader = void 0;
    var ral_1 = __importDefault(require_ral());
    var Is2 = __importStar(require_is2());
    var events_1 = require_events();
    var semaphore_1 = require_semaphore();
    var MessageReader;
    (function(MessageReader2) {
      function is(value) {
        const candidate = value;
        return candidate && Is2.func(candidate.listen) && Is2.func(candidate.dispose) && Is2.func(candidate.onError) && Is2.func(candidate.onClose) && Is2.func(candidate.onPartialMessage);
      }
      MessageReader2.is = is;
    })(MessageReader || (exports2.MessageReader = MessageReader = {}));
    var AbstractMessageReader = class {
      errorEmitter;
      closeEmitter;
      partialMessageEmitter;
      constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
        this.partialMessageEmitter = new events_1.Emitter();
      }
      dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
        this.partialMessageEmitter.dispose();
      }
      get onError() {
        return this.errorEmitter.event;
      }
      fireError(error) {
        this.errorEmitter.fire(this.asError(error));
      }
      get onClose() {
        return this.closeEmitter.event;
      }
      fireClose() {
        this.closeEmitter.fire(void 0);
      }
      get onPartialMessage() {
        return this.partialMessageEmitter.event;
      }
      firePartialMessage(info) {
        this.partialMessageEmitter.fire(info);
      }
      asError(error) {
        if (error instanceof Error) {
          return error;
        } else {
          return new Error(`Reader received error. Reason: ${Is2.string(error.message) ? error.message : "unknown"}`);
        }
      }
    };
    exports2.AbstractMessageReader = AbstractMessageReader;
    var ResolvedMessageReaderOptions;
    (function(ResolvedMessageReaderOptions2) {
      function fromOptions(options) {
        let charset;
        let result;
        let contentDecoder;
        const contentDecoders = /* @__PURE__ */ new Map();
        let contentTypeDecoder;
        const contentTypeDecoders = /* @__PURE__ */ new Map();
        if (options === void 0 || typeof options === "string") {
          charset = options ?? "utf-8";
        } else {
          charset = options.charset ?? "utf-8";
          if (options.contentDecoder !== void 0) {
            contentDecoder = options.contentDecoder;
            contentDecoders.set(contentDecoder.name, contentDecoder);
          }
          if (options.contentDecoders !== void 0) {
            for (const decoder of options.contentDecoders) {
              contentDecoders.set(decoder.name, decoder);
            }
          }
          if (options.contentTypeDecoder !== void 0) {
            contentTypeDecoder = options.contentTypeDecoder;
            contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
          }
          if (options.contentTypeDecoders !== void 0) {
            for (const decoder of options.contentTypeDecoders) {
              contentTypeDecoders.set(decoder.name, decoder);
            }
          }
        }
        if (contentTypeDecoder === void 0) {
          contentTypeDecoder = (0, ral_1.default)().applicationJson.decoder;
          contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
        }
        return { charset, contentDecoder, contentDecoders, contentTypeDecoder, contentTypeDecoders };
      }
      ResolvedMessageReaderOptions2.fromOptions = fromOptions;
    })(ResolvedMessageReaderOptions || (ResolvedMessageReaderOptions = {}));
    var ReadableStreamMessageReader = class extends AbstractMessageReader {
      readable;
      options;
      callback;
      nextMessageLength;
      messageToken;
      buffer;
      partialMessageTimer;
      _partialMessageTimeout;
      readSemaphore;
      constructor(readable, options) {
        super();
        this.readable = readable;
        this.options = ResolvedMessageReaderOptions.fromOptions(options);
        this.buffer = (0, ral_1.default)().messageBuffer.create(this.options.charset);
        this._partialMessageTimeout = 1e4;
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.readSemaphore = new semaphore_1.Semaphore(1);
      }
      set partialMessageTimeout(timeout) {
        this._partialMessageTimeout = timeout;
      }
      get partialMessageTimeout() {
        return this._partialMessageTimeout;
      }
      listen(callback) {
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.partialMessageTimer = void 0;
        this.callback = callback;
        const result = this.readable.onData((data) => {
          this.onData(data);
        });
        this.readable.onError((error) => this.fireError(error));
        this.readable.onClose(() => this.fireClose());
        return result;
      }
      onData(data) {
        try {
          this.buffer.append(data);
          while (true) {
            if (this.nextMessageLength === -1) {
              const headers = this.buffer.tryReadHeaders(true);
              if (!headers) {
                return;
              }
              const contentLength = headers.get("content-length");
              if (!contentLength) {
                this.fireError(new Error(`Header must provide a Content-Length property.
${JSON.stringify(Object.fromEntries(headers))}`));
                return;
              }
              const length = parseInt(contentLength);
              if (isNaN(length)) {
                this.fireError(new Error(`Content-Length value must be a number. Got ${contentLength}`));
                return;
              }
              this.nextMessageLength = length;
            }
            const body = this.buffer.tryReadBody(this.nextMessageLength);
            if (body === void 0) {
              this.setPartialMessageTimer();
              return;
            }
            this.clearPartialMessageTimer();
            this.nextMessageLength = -1;
            this.readSemaphore.lock(async () => {
              const bytes = this.options.contentDecoder !== void 0 ? await this.options.contentDecoder.decode(body) : body;
              const message = await this.options.contentTypeDecoder.decode(bytes, this.options);
              this.callback(message);
            }).catch((error) => {
              this.fireError(error);
            });
          }
        } catch (error) {
          this.fireError(error);
        }
      }
      clearPartialMessageTimer() {
        if (this.partialMessageTimer) {
          this.partialMessageTimer.dispose();
          this.partialMessageTimer = void 0;
        }
      }
      setPartialMessageTimer() {
        this.clearPartialMessageTimer();
        if (this._partialMessageTimeout <= 0) {
          return;
        }
        this.partialMessageTimer = (0, ral_1.default)().timer.setTimeout((token, timeout) => {
          this.partialMessageTimer = void 0;
          if (token === this.messageToken) {
            this.firePartialMessage({ messageToken: token, waitingTime: timeout });
            this.setPartialMessageTimer();
          }
        }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
      }
    };
    exports2.ReadableStreamMessageReader = ReadableStreamMessageReader;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/messageWriter.js
var require_messageWriter = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/messageWriter.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WriteableStreamMessageWriter = exports2.AbstractMessageWriter = exports2.MessageWriter = void 0;
    var ral_1 = __importDefault(require_ral());
    var Is2 = __importStar(require_is2());
    var semaphore_1 = require_semaphore();
    var events_1 = require_events();
    var ContentLength = "Content-Length: ";
    var CRLF = "\r\n";
    var MessageWriter;
    (function(MessageWriter2) {
      function is(value) {
        const candidate = value;
        return candidate && Is2.func(candidate.dispose) && Is2.func(candidate.onClose) && Is2.func(candidate.onError) && Is2.func(candidate.write);
      }
      MessageWriter2.is = is;
    })(MessageWriter || (exports2.MessageWriter = MessageWriter = {}));
    var AbstractMessageWriter = class {
      errorEmitter;
      closeEmitter;
      constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
      }
      dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
      }
      get onError() {
        return this.errorEmitter.event;
      }
      fireError(error, message, count) {
        this.errorEmitter.fire([this.asError(error), message, count]);
      }
      get onClose() {
        return this.closeEmitter.event;
      }
      fireClose() {
        this.closeEmitter.fire(void 0);
      }
      asError(error) {
        if (error instanceof Error) {
          return error;
        } else {
          return new Error(`Writer received error. Reason: ${Is2.string(error.message) ? error.message : "unknown"}`);
        }
      }
    };
    exports2.AbstractMessageWriter = AbstractMessageWriter;
    var ResolvedMessageWriterOptions;
    (function(ResolvedMessageWriterOptions2) {
      function fromOptions(options) {
        if (options === void 0 || typeof options === "string") {
          return { charset: options ?? "utf-8", contentTypeEncoder: (0, ral_1.default)().applicationJson.encoder };
        } else {
          return { charset: options.charset ?? "utf-8", contentEncoder: options.contentEncoder, contentTypeEncoder: options.contentTypeEncoder ?? (0, ral_1.default)().applicationJson.encoder };
        }
      }
      ResolvedMessageWriterOptions2.fromOptions = fromOptions;
    })(ResolvedMessageWriterOptions || (ResolvedMessageWriterOptions = {}));
    var WriteableStreamMessageWriter = class extends AbstractMessageWriter {
      writable;
      options;
      errorCount;
      writeSemaphore;
      constructor(writable, options) {
        super();
        this.writable = writable;
        this.options = ResolvedMessageWriterOptions.fromOptions(options);
        this.errorCount = 0;
        this.writeSemaphore = new semaphore_1.Semaphore(1);
        this.writable.onError((error) => this.fireError(error));
        this.writable.onClose(() => this.fireClose());
      }
      async write(msg) {
        return this.writeSemaphore.lock(async () => {
          const payload = this.options.contentTypeEncoder.encode(msg, this.options).then((buffer) => {
            if (this.options.contentEncoder !== void 0) {
              return this.options.contentEncoder.encode(buffer);
            } else {
              return buffer;
            }
          });
          return payload.then((buffer) => {
            const headers = [];
            headers.push(ContentLength, buffer.byteLength.toString(), CRLF);
            headers.push(CRLF);
            return this.doWrite(msg, headers, buffer);
          }, (error) => {
            this.fireError(error);
            throw error;
          });
        });
      }
      async doWrite(msg, headers, data) {
        try {
          await this.writable.write(headers.join(""), "ascii");
          return this.writable.write(data);
        } catch (error) {
          this.handleError(error, msg);
          return Promise.reject(error);
        }
      }
      handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
      }
      end() {
        this.writable.end();
      }
    };
    exports2.WriteableStreamMessageWriter = WriteableStreamMessageWriter;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/messageBuffer.js
var require_messageBuffer = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/messageBuffer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.AbstractMessageBuffer = void 0;
    var CR2 = 13;
    var LF2 = 10;
    var CRLF = "\r\n";
    var AbstractMessageBuffer = class {
      _encoding;
      _chunks;
      _totalLength;
      constructor(encoding = "utf-8") {
        this._encoding = encoding;
        this._chunks = [];
        this._totalLength = 0;
      }
      get encoding() {
        return this._encoding;
      }
      append(chunk) {
        const toAppend = typeof chunk === "string" ? this.fromString(chunk, this._encoding) : chunk;
        this._chunks.push(toAppend);
        this._totalLength += toAppend.byteLength;
      }
      tryReadHeaders(lowerCaseKeys = false) {
        if (this._chunks.length === 0) {
          return void 0;
        }
        let state = 0;
        let chunkIndex = 0;
        let offset = 0;
        let chunkBytesRead = 0;
        row: while (chunkIndex < this._chunks.length) {
          const chunk = this._chunks[chunkIndex];
          offset = 0;
          while (offset < chunk.length) {
            const value = chunk[offset];
            switch (value) {
              case CR2:
                switch (state) {
                  case 0:
                    state = 1;
                    break;
                  case 2:
                    state = 3;
                    break;
                  default:
                    state = 0;
                }
                break;
              case LF2:
                switch (state) {
                  case 1:
                    state = 2;
                    break;
                  case 3:
                    state = 4;
                    offset++;
                    break row;
                  default:
                    state = 0;
                }
                break;
              default:
                state = 0;
            }
            offset++;
          }
          chunkBytesRead += chunk.byteLength;
          chunkIndex++;
        }
        if (state !== 4) {
          return void 0;
        }
        const buffer = this._read(chunkBytesRead + offset);
        const result = /* @__PURE__ */ new Map();
        const headers = this.toString(buffer, "ascii").split(CRLF);
        if (headers.length < 2) {
          return result;
        }
        for (let i2 = 0; i2 < headers.length - 2; i2++) {
          const header = headers[i2];
          const index = header.indexOf(":");
          if (index === -1) {
            throw new Error(`Message header must separate key and value using ':'
${header}`);
          }
          const key = header.substr(0, index);
          const value = header.substr(index + 1).trim();
          result.set(lowerCaseKeys ? key.toLowerCase() : key, value);
        }
        return result;
      }
      tryReadBody(length) {
        if (this._totalLength < length) {
          return void 0;
        }
        return this._read(length);
      }
      get numberOfBytes() {
        return this._totalLength;
      }
      _read(byteCount) {
        if (byteCount === 0) {
          return this.emptyBuffer();
        }
        if (byteCount > this._totalLength) {
          throw new Error(`Cannot read so many bytes!`);
        }
        if (this._chunks[0].byteLength === byteCount) {
          const chunk = this._chunks[0];
          this._chunks.shift();
          this._totalLength -= byteCount;
          return this.asNative(chunk);
        }
        if (this._chunks[0].byteLength > byteCount) {
          const chunk = this._chunks[0];
          const result2 = this.asNative(chunk, byteCount);
          this._chunks[0] = chunk.slice(byteCount);
          this._totalLength -= byteCount;
          return result2;
        }
        const result = this.allocNative(byteCount);
        let resultOffset = 0;
        const chunkIndex = 0;
        while (byteCount > 0) {
          const chunk = this._chunks[chunkIndex];
          if (chunk.byteLength > byteCount) {
            const chunkPart = chunk.slice(0, byteCount);
            result.set(chunkPart, resultOffset);
            resultOffset += byteCount;
            this._chunks[chunkIndex] = chunk.slice(byteCount);
            this._totalLength -= byteCount;
            byteCount -= byteCount;
          } else {
            result.set(chunk, resultOffset);
            resultOffset += chunk.byteLength;
            this._chunks.shift();
            this._totalLength -= chunk.byteLength;
            byteCount -= chunk.byteLength;
          }
        }
        return result;
      }
    };
    exports2.AbstractMessageBuffer = AbstractMessageBuffer;
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/connection.js
var require_connection = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/connection.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ConnectionOptions = exports2.MessageStrategy = exports2.CancellationStrategy = exports2.CancellationSenderStrategy = exports2.CancellationReceiverStrategy = exports2.RequestCancellationReceiverStrategy = exports2.IdCancellationReceiverStrategy = exports2.ConnectionStrategy = exports2.ConnectionError = exports2.ConnectionErrors = exports2.LogTraceNotification = exports2.SetTraceNotification = exports2.TraceFormat = exports2.TraceValues = exports2.TraceValue = exports2.Trace = exports2.NullLogger = exports2.ProgressType = exports2.ProgressToken = void 0;
    exports2.createMessageConnection = createMessageConnection;
    var ral_1 = __importDefault(require_ral());
    var Is2 = __importStar(require_is2());
    var messages_1 = require_messages();
    var linkedMap_1 = require_linkedMap();
    var events_1 = require_events();
    var cancellation_1 = require_cancellation();
    var CancelNotification;
    (function(CancelNotification2) {
      CancelNotification2.type = new messages_1.NotificationType("$/cancelRequest");
    })(CancelNotification || (CancelNotification = {}));
    var ProgressToken;
    (function(ProgressToken2) {
      function is(value) {
        return typeof value === "string" || typeof value === "number";
      }
      ProgressToken2.is = is;
    })(ProgressToken || (exports2.ProgressToken = ProgressToken = {}));
    var ProgressNotification;
    (function(ProgressNotification2) {
      ProgressNotification2.type = new messages_1.NotificationType("$/progress");
    })(ProgressNotification || (ProgressNotification = {}));
    var ProgressType = class {
      /**
       * Clients must not use these properties. They are here to ensure correct typing.
       * in TypeScript
       */
      __;
      _pr;
      constructor() {
      }
    };
    exports2.ProgressType = ProgressType;
    var StarRequestHandler;
    (function(StarRequestHandler2) {
      function is(value) {
        return Is2.func(value);
      }
      StarRequestHandler2.is = is;
    })(StarRequestHandler || (StarRequestHandler = {}));
    exports2.NullLogger = Object.freeze({
      error: () => {
      },
      warn: () => {
      },
      info: () => {
      },
      log: () => {
      }
    });
    var Trace;
    (function(Trace2) {
      Trace2[Trace2["Off"] = 0] = "Off";
      Trace2[Trace2["Messages"] = 1] = "Messages";
      Trace2[Trace2["Compact"] = 2] = "Compact";
      Trace2[Trace2["Verbose"] = 3] = "Verbose";
    })(Trace || (exports2.Trace = Trace = {}));
    var TraceValue;
    (function(TraceValue2) {
      TraceValue2.Off = "off";
      TraceValue2.Messages = "messages";
      TraceValue2.Compact = "compact";
      TraceValue2.Verbose = "verbose";
    })(TraceValue || (exports2.TraceValue = TraceValue = {}));
    exports2.TraceValues = TraceValue;
    (function(Trace2) {
      function fromString(value) {
        if (!Is2.string(value)) {
          return Trace2.Off;
        }
        value = value.toLowerCase();
        switch (value) {
          case "off":
            return Trace2.Off;
          case "messages":
            return Trace2.Messages;
          case "compact":
            return Trace2.Compact;
          case "verbose":
            return Trace2.Verbose;
          default:
            return Trace2.Off;
        }
      }
      Trace2.fromString = fromString;
      function toString(value) {
        switch (value) {
          case Trace2.Off:
            return "off";
          case Trace2.Messages:
            return "messages";
          case Trace2.Compact:
            return "compact";
          case Trace2.Verbose:
            return "verbose";
          default:
            return "off";
        }
      }
      Trace2.toString = toString;
    })(Trace || (exports2.Trace = Trace = {}));
    var TraceFormat;
    (function(TraceFormat2) {
      TraceFormat2["Text"] = "text";
      TraceFormat2["JSON"] = "json";
    })(TraceFormat || (exports2.TraceFormat = TraceFormat = {}));
    (function(TraceFormat2) {
      function fromString(value) {
        if (!Is2.string(value)) {
          return TraceFormat2.Text;
        }
        value = value.toLowerCase();
        if (value === "json") {
          return TraceFormat2.JSON;
        } else {
          return TraceFormat2.Text;
        }
      }
      TraceFormat2.fromString = fromString;
    })(TraceFormat || (exports2.TraceFormat = TraceFormat = {}));
    var SetTraceNotification;
    (function(SetTraceNotification2) {
      SetTraceNotification2.type = new messages_1.NotificationType("$/setTrace");
    })(SetTraceNotification || (exports2.SetTraceNotification = SetTraceNotification = {}));
    var LogTraceNotification;
    (function(LogTraceNotification2) {
      LogTraceNotification2.type = new messages_1.NotificationType("$/logTrace");
    })(LogTraceNotification || (exports2.LogTraceNotification = LogTraceNotification = {}));
    var ConnectionErrors;
    (function(ConnectionErrors2) {
      ConnectionErrors2[ConnectionErrors2["Closed"] = 1] = "Closed";
      ConnectionErrors2[ConnectionErrors2["Disposed"] = 2] = "Disposed";
      ConnectionErrors2[ConnectionErrors2["AlreadyListening"] = 3] = "AlreadyListening";
    })(ConnectionErrors || (exports2.ConnectionErrors = ConnectionErrors = {}));
    var ConnectionError = class _ConnectionError extends Error {
      code;
      constructor(code, message) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, _ConnectionError.prototype);
      }
    };
    exports2.ConnectionError = ConnectionError;
    var ConnectionStrategy;
    (function(ConnectionStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && Is2.func(candidate.cancelUndispatched);
      }
      ConnectionStrategy2.is = is;
    })(ConnectionStrategy || (exports2.ConnectionStrategy = ConnectionStrategy = {}));
    var IdCancellationReceiverStrategy;
    (function(IdCancellationReceiverStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && (candidate.kind === void 0 || candidate.kind === "id") && Is2.func(candidate.createCancellationTokenSource) && (candidate.dispose === void 0 || Is2.func(candidate.dispose));
      }
      IdCancellationReceiverStrategy2.is = is;
    })(IdCancellationReceiverStrategy || (exports2.IdCancellationReceiverStrategy = IdCancellationReceiverStrategy = {}));
    var RequestCancellationReceiverStrategy;
    (function(RequestCancellationReceiverStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && candidate.kind === "request" && Is2.func(candidate.createCancellationTokenSource) && (candidate.dispose === void 0 || Is2.func(candidate.dispose));
      }
      RequestCancellationReceiverStrategy2.is = is;
    })(RequestCancellationReceiverStrategy || (exports2.RequestCancellationReceiverStrategy = RequestCancellationReceiverStrategy = {}));
    var CancellationReceiverStrategy;
    (function(CancellationReceiverStrategy2) {
      CancellationReceiverStrategy2.Message = Object.freeze({
        createCancellationTokenSource(_2) {
          return new cancellation_1.CancellationTokenSource();
        }
      });
      function is(value) {
        return IdCancellationReceiverStrategy.is(value) || RequestCancellationReceiverStrategy.is(value);
      }
      CancellationReceiverStrategy2.is = is;
    })(CancellationReceiverStrategy || (exports2.CancellationReceiverStrategy = CancellationReceiverStrategy = {}));
    var CancellationSenderStrategy;
    (function(CancellationSenderStrategy2) {
      CancellationSenderStrategy2.Message = Object.freeze({
        sendCancellation(conn, id) {
          return conn.sendNotification(CancelNotification.type, { id });
        },
        cleanup(_2) {
        }
      });
      function is(value) {
        const candidate = value;
        return candidate && Is2.func(candidate.sendCancellation) && Is2.func(candidate.cleanup);
      }
      CancellationSenderStrategy2.is = is;
    })(CancellationSenderStrategy || (exports2.CancellationSenderStrategy = CancellationSenderStrategy = {}));
    var CancellationStrategy;
    (function(CancellationStrategy2) {
      CancellationStrategy2.Message = Object.freeze({
        receiver: CancellationReceiverStrategy.Message,
        sender: CancellationSenderStrategy.Message
      });
      function is(value) {
        const candidate = value;
        return candidate && CancellationReceiverStrategy.is(candidate.receiver) && CancellationSenderStrategy.is(candidate.sender);
      }
      CancellationStrategy2.is = is;
    })(CancellationStrategy || (exports2.CancellationStrategy = CancellationStrategy = {}));
    var MessageStrategy;
    (function(MessageStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && Is2.func(candidate.handleMessage);
      }
      MessageStrategy2.is = is;
    })(MessageStrategy || (exports2.MessageStrategy = MessageStrategy = {}));
    var ConnectionOptions;
    (function(ConnectionOptions2) {
      function is(value) {
        const candidate = value;
        return candidate && (CancellationStrategy.is(candidate.cancellationStrategy) || ConnectionStrategy.is(candidate.connectionStrategy) || MessageStrategy.is(candidate.messageStrategy) || Is2.number(candidate.maxParallelism));
      }
      ConnectionOptions2.is = is;
    })(ConnectionOptions || (exports2.ConnectionOptions = ConnectionOptions = {}));
    var ConnectionState;
    (function(ConnectionState2) {
      ConnectionState2[ConnectionState2["New"] = 1] = "New";
      ConnectionState2[ConnectionState2["Listening"] = 2] = "Listening";
      ConnectionState2[ConnectionState2["Closed"] = 3] = "Closed";
      ConnectionState2[ConnectionState2["Disposed"] = 4] = "Disposed";
    })(ConnectionState || (ConnectionState = {}));
    function createMessageConnection(messageReader, messageWriter, _logger, options) {
      const logger = _logger !== void 0 ? _logger : exports2.NullLogger;
      let sequenceNumber = 0;
      let notificationSequenceNumber = 0;
      let unknownResponseSequenceNumber = 0;
      const version = "2.0";
      const maxParallelism = options?.maxParallelism ?? -1;
      let inFlight = 0;
      let starRequestHandler = void 0;
      const requestHandlers = /* @__PURE__ */ new Map();
      let starNotificationHandler = void 0;
      const notificationHandlers = /* @__PURE__ */ new Map();
      const progressHandlers = /* @__PURE__ */ new Map();
      let timer;
      let messageQueue = new linkedMap_1.LinkedMap();
      let responsePromises = /* @__PURE__ */ new Map();
      let knownCanceledRequests = /* @__PURE__ */ new Set();
      let requestTokens = /* @__PURE__ */ new Map();
      let trace = Trace.Off;
      let traceFormat = TraceFormat.Text;
      let tracer;
      let state = ConnectionState.New;
      const errorEmitter = new events_1.Emitter();
      const closeEmitter = new events_1.Emitter();
      const unhandledNotificationEmitter = new events_1.Emitter();
      const unhandledProgressEmitter = new events_1.Emitter();
      const disposeEmitter = new events_1.Emitter();
      const cancellationStrategy = options && options.cancellationStrategy ? options.cancellationStrategy : CancellationStrategy.Message;
      function cancelUndispatched(_message) {
        return void 0;
      }
      function isListening() {
        return state === ConnectionState.Listening;
      }
      function isClosed() {
        return state === ConnectionState.Closed;
      }
      function isDisposed() {
        return state === ConnectionState.Disposed;
      }
      function closeHandler() {
        if (state === ConnectionState.New || state === ConnectionState.Listening) {
          state = ConnectionState.Closed;
          closeEmitter.fire(void 0);
        }
      }
      function readErrorHandler(error) {
        errorEmitter.fire([error, void 0, void 0]);
      }
      function writeErrorHandler(data) {
        errorEmitter.fire(data);
      }
      messageReader.onClose(closeHandler);
      messageReader.onError(readErrorHandler);
      messageWriter.onClose(closeHandler);
      messageWriter.onError(writeErrorHandler);
      function createRequestQueueKey(id) {
        if (id === null) {
          throw new Error(`Can't send requests with id null since the response can't be correlated.`);
        }
        return "req-" + id.toString();
      }
      function createResponseQueueKey(id) {
        if (id === null) {
          return "res-unknown-" + (++unknownResponseSequenceNumber).toString();
        } else {
          return "res-" + id.toString();
        }
      }
      function createNotificationQueueKey() {
        return "not-" + (++notificationSequenceNumber).toString();
      }
      function addMessageToQueue(queue, message) {
        if (messages_1.Message.isRequest(message)) {
          queue.set(createRequestQueueKey(message.id), message);
        } else if (messages_1.Message.isResponse(message)) {
          if (maxParallelism === -1) {
            queue.set(createResponseQueueKey(message.id), message);
          } else {
            handleResponse(message);
          }
        } else {
          queue.set(createNotificationQueueKey(), message);
        }
      }
      function triggerMessageQueue() {
        if (timer || messageQueue.size === 0) {
          return;
        }
        if (maxParallelism !== -1 && inFlight >= maxParallelism) {
          return;
        }
        timer = (0, ral_1.default)().timer.setImmediate(async () => {
          timer = void 0;
          if (messageQueue.size === 0) {
            return;
          }
          if (maxParallelism !== -1 && inFlight >= maxParallelism) {
            return;
          }
          const message = messageQueue.shift();
          let result;
          try {
            inFlight++;
            const messageStrategy = options?.messageStrategy;
            if (MessageStrategy.is(messageStrategy)) {
              result = messageStrategy.handleMessage(message, handleMessage);
            } else {
              result = handleMessage(message);
            }
          } catch (error) {
            logger.error(`Processing message queue failed: ${error.toString()}`);
          } finally {
            if (result instanceof Promise) {
              result.then(() => {
                inFlight--;
                triggerMessageQueue();
              }).catch((error) => {
                logger.error(`Processing message queue failed: ${error.toString()}`);
              });
            } else {
              inFlight--;
            }
            triggerMessageQueue();
          }
        });
      }
      async function handleMessage(message) {
        if (messages_1.Message.isRequest(message)) {
          return handleRequest(message);
        } else if (messages_1.Message.isNotification(message)) {
          return handleNotification(message);
        } else if (messages_1.Message.isResponse(message)) {
          return handleResponse(message);
        } else {
          return handleInvalidMessage(message);
        }
      }
      const callback = (message) => {
        try {
          if (messages_1.Message.isNotification(message) && message.method === CancelNotification.type.method) {
            const cancelId = message.params.id;
            const key = createRequestQueueKey(cancelId);
            const toCancel = messageQueue.get(key);
            if (messages_1.Message.isRequest(toCancel)) {
              const strategy = options?.connectionStrategy;
              const response = strategy && strategy.cancelUndispatched ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : cancelUndispatched(toCancel);
              if (response && (response.error !== void 0 || response.result !== void 0)) {
                messageQueue.delete(key);
                requestTokens.delete(cancelId);
                response.id = toCancel.id;
                traceSendingResponse(response, message.method, Date.now());
                messageWriter.write(response).catch(() => logger.error(`Sending response for canceled message failed.`));
                return;
              }
            }
            const cancellationToken = requestTokens.get(cancelId);
            if (cancellationToken !== void 0) {
              cancellationToken.cancel();
              traceReceivedNotification(message);
              return;
            } else {
              knownCanceledRequests.add(cancelId);
            }
          }
          addMessageToQueue(messageQueue, message);
        } finally {
          triggerMessageQueue();
        }
      };
      async function handleRequest(requestMessage) {
        if (isDisposed()) {
          return Promise.resolve();
        }
        function reply(resultOrError, method, startTime2) {
          const message = {
            jsonrpc: version,
            id: requestMessage.id
          };
          if (resultOrError instanceof messages_1.ResponseError) {
            message.error = resultOrError.toJson();
          } else {
            message.result = resultOrError === void 0 ? null : resultOrError;
          }
          traceSendingResponse(message, method, startTime2);
          return messageWriter.write(message);
        }
        function replyError(error, method, startTime2) {
          const message = {
            jsonrpc: version,
            id: requestMessage.id,
            error: error.toJson()
          };
          traceSendingResponse(message, method, startTime2);
          return messageWriter.write(message);
        }
        traceReceivedRequest(requestMessage);
        const element = requestHandlers.get(requestMessage.method);
        let type;
        let requestHandler;
        if (element) {
          type = element.type;
          requestHandler = element.handler;
        }
        const startTime = Date.now();
        if (requestHandler || starRequestHandler) {
          const tokenKey = requestMessage.id ?? String(Date.now());
          const cancellationSource = IdCancellationReceiverStrategy.is(cancellationStrategy.receiver) ? cancellationStrategy.receiver.createCancellationTokenSource(tokenKey) : cancellationStrategy.receiver.createCancellationTokenSource(requestMessage);
          if (requestMessage.id !== null && knownCanceledRequests.has(requestMessage.id)) {
            cancellationSource.cancel();
          }
          if (requestMessage.id !== null) {
            requestTokens.set(tokenKey, cancellationSource);
          }
          try {
            let handlerResult;
            if (requestHandler) {
              if (requestMessage.params === void 0) {
                if (type !== void 0 && type.numberOfParams !== 0) {
                  return replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines ${type.numberOfParams} params but received none.`), requestMessage.method, startTime);
                }
                handlerResult = requestHandler(cancellationSource.token);
              } else if (Array.isArray(requestMessage.params)) {
                if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byName) {
                  return replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by name but received parameters by position`), requestMessage.method, startTime);
                }
                handlerResult = requestHandler(...requestMessage.params, cancellationSource.token);
              } else {
                if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                  return replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by position but received parameters by name`), requestMessage.method, startTime);
                }
                handlerResult = requestHandler(requestMessage.params, cancellationSource.token);
              }
            } else if (starRequestHandler) {
              handlerResult = starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
            }
            const resultOrError = await handlerResult;
            await reply(resultOrError, requestMessage.method, startTime);
          } catch (error) {
            if (error instanceof messages_1.ResponseError) {
              await reply(error, requestMessage.method, startTime);
            } else if (error && Is2.string(error.message)) {
              await replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
            } else {
              await replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
            }
          } finally {
            requestTokens.delete(tokenKey);
          }
        } else {
          await replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, `Unhandled method ${requestMessage.method}`), requestMessage.method, startTime);
        }
      }
      function handleResponse(responseMessage) {
        if (isDisposed()) {
          return;
        }
        if (responseMessage.id === null) {
          if (responseMessage.error) {
            logger.error(`Received response message without id: Error is: 
${JSON.stringify(responseMessage.error, void 0, 4)}`);
          } else {
            logger.error(`Received response message without id. No further error information provided.`);
          }
        } else {
          const key = responseMessage.id;
          const responsePromise = responsePromises.get(key);
          traceReceivedResponse(responseMessage, responsePromise);
          if (responsePromise !== void 0) {
            responsePromises.delete(key);
            try {
              if (responseMessage.error) {
                const error = responseMessage.error;
                responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
              } else if (responseMessage.result !== void 0) {
                responsePromise.resolve(responseMessage.result);
              } else {
                throw new Error("Should never happen.");
              }
            } catch (error) {
              if (error.message) {
                logger.error(`Response handler '${responsePromise.method}' failed with message: ${error.message}`);
              } else {
                logger.error(`Response handler '${responsePromise.method}' failed unexpectedly.`);
              }
            }
          }
        }
      }
      async function handleNotification(message) {
        if (isDisposed()) {
          return;
        }
        let type = void 0;
        let notificationHandler;
        if (message.method === CancelNotification.type.method) {
          const cancelId = message.params.id;
          knownCanceledRequests.delete(cancelId);
          traceReceivedNotification(message);
          return;
        } else {
          const element = notificationHandlers.get(message.method);
          if (element) {
            notificationHandler = element.handler;
            type = element.type;
          }
        }
        if (notificationHandler || starNotificationHandler) {
          try {
            traceReceivedNotification(message);
            if (notificationHandler) {
              if (message.params === void 0) {
                if (type !== void 0) {
                  if (type.numberOfParams !== 0 && type.parameterStructures !== messages_1.ParameterStructures.byName) {
                    logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received none.`);
                  }
                }
                await notificationHandler();
              } else if (Array.isArray(message.params)) {
                const params = message.params;
                if (message.method === ProgressNotification.type.method && params.length === 2 && ProgressToken.is(params[0])) {
                  await notificationHandler({ token: params[0], value: params[1] });
                } else {
                  if (type !== void 0) {
                    if (type.parameterStructures === messages_1.ParameterStructures.byName) {
                      logger.error(`Notification ${message.method} defines parameters by name but received parameters by position`);
                    }
                    if (type.numberOfParams !== message.params.length) {
                      logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received ${params.length} arguments`);
                    }
                  }
                  await notificationHandler(...params);
                }
              } else {
                if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                  logger.error(`Notification ${message.method} defines parameters by position but received parameters by name`);
                }
                await notificationHandler(message.params);
              }
            } else if (starNotificationHandler) {
              await starNotificationHandler(message.method, message.params);
            }
          } catch (error) {
            if (error.message) {
              logger.error(`Notification handler '${message.method}' failed with message: ${error.message}`);
            } else {
              logger.error(`Notification handler '${message.method}' failed unexpectedly.`);
            }
          }
        } else {
          unhandledNotificationEmitter.fire(message);
        }
      }
      function handleInvalidMessage(message) {
        if (!message) {
          logger.error("Received empty message.");
          return;
        }
        logger.error(`Received message which is neither a response nor a notification message:
${JSON.stringify(message, null, 4)}`);
        const responseMessage = message;
        if (Is2.string(responseMessage.id) || Is2.number(responseMessage.id)) {
          const key = responseMessage.id;
          const responseHandler = responsePromises.get(key);
          if (responseHandler) {
            responseHandler.reject(new Error("The received response has neither a result nor an error property."));
          }
        }
      }
      function stringifyTrace(params) {
        if (params === void 0 || params === null) {
          return void 0;
        }
        switch (trace) {
          case Trace.Verbose:
            return JSON.stringify(params, null, 4);
          case Trace.Compact:
            return JSON.stringify(params);
          default:
            return void 0;
        }
      }
      function traceSendingRequest(message) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) {
            data = `Params: ${stringifyTrace(message.params)}`;
          }
          tracer.log(`Sending request '${message.method} - (${message.id})'.`, data);
        } else {
          logLSPMessage("send-request", message);
        }
      }
      function traceSendingNotification(message) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.params) {
              data = `Params: ${stringifyTrace(message.params)}`;
            } else {
              data = "No parameters provided.";
            }
          }
          tracer.log(`Sending notification '${message.method}'.`, data);
        } else {
          logLSPMessage("send-notification", message);
        }
      }
      function traceSendingResponse(message, method, startTime) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.error && message.error.data) {
              data = `Error data: ${stringifyTrace(message.error.data)}`;
            } else {
              if (message.result) {
                data = `Result: ${stringifyTrace(message.result)}`;
              } else if (message.error === void 0) {
                data = "No result returned.";
              }
            }
          }
          const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : "";
          tracer.log(`Sending response '${method} - (${message.id})'. Processing request took ${Date.now() - startTime}ms.${error}`, data);
        } else {
          logLSPMessage("send-response", message);
        }
      }
      function traceReceivedRequest(message) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) {
            data = `Params: ${stringifyTrace(message.params)}`;
          }
          tracer.log(`Received request '${message.method} - (${message.id})'.`, data);
        } else {
          logLSPMessage("receive-request", message);
        }
      }
      function traceReceivedNotification(message) {
        if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.params) {
              data = `Params: ${stringifyTrace(message.params)}`;
            } else {
              data = "No parameters provided.";
            }
          }
          tracer.log(`Received notification '${message.method}'.`, data);
        } else {
          logLSPMessage("receive-notification", message);
        }
      }
      function traceReceivedResponse(message, responsePromise) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.error && message.error.data) {
              data = `Error data: ${stringifyTrace(message.error.data)}`;
            } else {
              if (message.result) {
                data = `Result: ${stringifyTrace(message.result)}`;
              } else if (message.error === void 0) {
                data = "No result returned.";
              }
            }
          }
          if (responsePromise) {
            const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : "";
            tracer.log(`Received response '${responsePromise.method} - (${message.id})' in ${Date.now() - responsePromise.timerStart}ms.${error}`, data);
          } else {
            tracer.log(`Received response ${message.id} without active response promise.`, data);
          }
        } else {
          logLSPMessage("receive-response", message);
        }
      }
      function logLSPMessage(type, message) {
        if (!tracer || trace === Trace.Off) {
          return;
        }
        const lspMessage = {
          isLSPMessage: true,
          type,
          message,
          timestamp: Date.now()
        };
        tracer.log(lspMessage);
      }
      function throwIfClosedOrDisposed() {
        if (isClosed()) {
          throw new ConnectionError(ConnectionErrors.Closed, "Connection is closed.");
        }
        if (isDisposed()) {
          throw new ConnectionError(ConnectionErrors.Disposed, "Connection is disposed.");
        }
      }
      function throwIfListening() {
        if (isListening()) {
          throw new ConnectionError(ConnectionErrors.AlreadyListening, "Connection is already listening");
        }
      }
      function throwIfNotListening() {
        if (!isListening()) {
          throw new Error("Call listen() first.");
        }
      }
      function undefinedToNull(param) {
        if (param === void 0) {
          return null;
        } else {
          return param;
        }
      }
      function nullToUndefined(param) {
        if (param === null) {
          return void 0;
        } else {
          return param;
        }
      }
      function isNamedParam(param) {
        return param !== void 0 && param !== null && !Array.isArray(param) && typeof param === "object";
      }
      function computeSingleParam(parameterStructures, param) {
        switch (parameterStructures) {
          case messages_1.ParameterStructures.auto:
            if (isNamedParam(param)) {
              return nullToUndefined(param);
            } else {
              return [undefinedToNull(param)];
            }
          case messages_1.ParameterStructures.byName:
            if (!isNamedParam(param)) {
              throw new Error(`Received parameters by name but param is not an object literal.`);
            }
            return nullToUndefined(param);
          case messages_1.ParameterStructures.byPosition:
            return [undefinedToNull(param)];
          default:
            throw new Error(`Unknown parameter structure ${parameterStructures.toString()}`);
        }
      }
      function computeMessageParams(type, params) {
        let result;
        const numberOfParams = type.numberOfParams;
        switch (numberOfParams) {
          case 0:
            result = void 0;
            break;
          case 1:
            result = computeSingleParam(type.parameterStructures, params[0]);
            break;
          default:
            result = [];
            for (let i2 = 0; i2 < params.length && i2 < numberOfParams; i2++) {
              result.push(undefinedToNull(params[i2]));
            }
            if (params.length < numberOfParams) {
              for (let i2 = params.length; i2 < numberOfParams; i2++) {
                result.push(null);
              }
            }
            break;
        }
        return result;
      }
      const connection = {
        sendNotification: (type, ...args) => {
          throwIfClosedOrDisposed();
          let method;
          let messageParams;
          if (Is2.string(type)) {
            method = type;
            const first = args[0];
            let paramStart = 0;
            let parameterStructures = messages_1.ParameterStructures.auto;
            if (messages_1.ParameterStructures.is(first)) {
              paramStart = 1;
              parameterStructures = first;
            }
            const paramEnd = args.length;
            const numberOfParams = paramEnd - paramStart;
            switch (numberOfParams) {
              case 0:
                messageParams = void 0;
                break;
              case 1:
                messageParams = computeSingleParam(parameterStructures, args[paramStart]);
                break;
              default:
                if (parameterStructures === messages_1.ParameterStructures.byName) {
                  throw new Error(`Received ${numberOfParams} parameters for 'by Name' notification parameter structure.`);
                }
                messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
                break;
            }
          } else {
            const params = args;
            method = type.method;
            messageParams = computeMessageParams(type, params);
          }
          const notificationMessage = {
            jsonrpc: version,
            method,
            params: messageParams
          };
          traceSendingNotification(notificationMessage);
          return messageWriter.write(notificationMessage).catch((error) => {
            logger.error(`Sending notification failed.`);
            throw error;
          });
        },
        onNotification: (type, handler) => {
          throwIfClosedOrDisposed();
          let method;
          if (Is2.func(type)) {
            starNotificationHandler = type;
          } else if (handler) {
            if (Is2.string(type)) {
              method = type;
              notificationHandlers.set(type, { type: void 0, handler });
            } else {
              method = type.method;
              notificationHandlers.set(type.method, { type, handler });
            }
          }
          return {
            dispose: () => {
              if (method !== void 0) {
                if (notificationHandlers.get(method)?.handler === handler) {
                  notificationHandlers.delete(method);
                }
              } else if (starNotificationHandler === type) {
                starNotificationHandler = void 0;
              }
            }
          };
        },
        onProgress: (_type, token, handler) => {
          if (progressHandlers.has(token)) {
            throw new Error(`Progress handler for token ${token} already registered`);
          }
          progressHandlers.set(token, handler);
          return {
            dispose: () => {
              if (progressHandlers.get(token) === handler) {
                progressHandlers.delete(token);
              }
            }
          };
        },
        sendProgress: (_type, token, value) => {
          return connection.sendNotification(ProgressNotification.type, { token, value });
        },
        onUnhandledProgress: unhandledProgressEmitter.event,
        sendRequest: (type, ...args) => {
          throwIfClosedOrDisposed();
          throwIfNotListening();
          function sendCancellation(connection2, id2) {
            const p2 = cancellationStrategy.sender.sendCancellation(connection2, id2);
            if (p2 === void 0) {
              logger.log(`Received no promise from cancellation strategy when cancelling id ${id2}`);
            } else {
              p2.catch(() => {
                logger.log(`Sending cancellation messages for id ${id2} failed.`);
              });
            }
          }
          let method;
          let messageParams;
          let token = void 0;
          if (Is2.string(type)) {
            method = type;
            const first = args[0];
            const last = args[args.length - 1];
            let paramStart = 0;
            let parameterStructures = messages_1.ParameterStructures.auto;
            if (messages_1.ParameterStructures.is(first)) {
              paramStart = 1;
              parameterStructures = first;
            }
            let paramEnd = args.length;
            if (cancellation_1.CancellationToken.is(last)) {
              paramEnd = paramEnd - 1;
              token = last;
            }
            const numberOfParams = paramEnd - paramStart;
            switch (numberOfParams) {
              case 0:
                messageParams = void 0;
                break;
              case 1:
                messageParams = computeSingleParam(parameterStructures, args[paramStart]);
                break;
              default:
                if (parameterStructures === messages_1.ParameterStructures.byName) {
                  throw new Error(`Received ${numberOfParams} parameters for 'by Name' request parameter structure.`);
                }
                messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
                break;
            }
          } else {
            const params = args;
            method = type.method;
            messageParams = computeMessageParams(type, params);
            const numberOfParams = type.numberOfParams;
            token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : void 0;
          }
          const id = sequenceNumber++;
          let disposable;
          let tokenWasCancelled = false;
          if (token !== void 0) {
            if (token.isCancellationRequested) {
              tokenWasCancelled = true;
            } else {
              disposable = token.onCancellationRequested(() => {
                sendCancellation(connection, id);
              });
            }
          }
          const requestMessage = {
            jsonrpc: version,
            id,
            method,
            params: messageParams
          };
          traceSendingRequest(requestMessage);
          if (typeof cancellationStrategy.sender.enableCancellation === "function") {
            cancellationStrategy.sender.enableCancellation(requestMessage);
          }
          return new Promise(async (resolve2, reject) => {
            const resolveWithCleanup = (r2) => {
              resolve2(r2);
              cancellationStrategy.sender.cleanup(id);
              disposable?.dispose();
            };
            const rejectWithCleanup = (r2) => {
              reject(r2);
              cancellationStrategy.sender.cleanup(id);
              disposable?.dispose();
            };
            const responsePromise = { method, timerStart: Date.now(), resolve: resolveWithCleanup, reject: rejectWithCleanup };
            try {
              responsePromises.set(id, responsePromise);
              await messageWriter.write(requestMessage);
              if (tokenWasCancelled) {
                sendCancellation(connection, id);
              }
            } catch (error) {
              responsePromises.delete(id);
              responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, error.message ? error.message : "Unknown reason"));
              logger.error(`Sending request failed.`);
            }
          });
        },
        onRequest: (type, handler) => {
          throwIfClosedOrDisposed();
          let method = null;
          if (StarRequestHandler.is(type)) {
            method = void 0;
            starRequestHandler = type;
          } else if (Is2.string(type)) {
            method = null;
            if (handler !== void 0) {
              method = type;
              requestHandlers.set(type, { handler, type: void 0 });
            }
          } else {
            if (handler !== void 0) {
              method = type.method;
              requestHandlers.set(type.method, { type, handler });
            }
          }
          return {
            dispose: () => {
              if (method === null) {
                return;
              }
              if (method !== void 0) {
                if (requestHandlers.get(method)?.handler === handler) {
                  requestHandlers.delete(method);
                }
              } else if (starRequestHandler === type) {
                starRequestHandler = void 0;
              }
            }
          };
        },
        hasPendingResponse: () => {
          return responsePromises.size > 0;
        },
        trace: async (_value, _tracer, sendNotificationOrTraceOptions) => {
          let _sendNotification = false;
          let _traceFormat = TraceFormat.Text;
          if (sendNotificationOrTraceOptions !== void 0) {
            if (Is2.boolean(sendNotificationOrTraceOptions)) {
              _sendNotification = sendNotificationOrTraceOptions;
            } else {
              _sendNotification = sendNotificationOrTraceOptions.sendNotification || false;
              _traceFormat = sendNotificationOrTraceOptions.traceFormat || TraceFormat.Text;
            }
          }
          trace = _value;
          traceFormat = _traceFormat;
          if (trace === Trace.Off) {
            tracer = void 0;
          } else {
            tracer = _tracer;
          }
          if (_sendNotification && !isClosed() && !isDisposed()) {
            await connection.sendNotification(SetTraceNotification.type, { value: Trace.toString(_value) });
          }
        },
        onError: errorEmitter.event,
        onClose: closeEmitter.event,
        onUnhandledNotification: unhandledNotificationEmitter.event,
        onDispose: disposeEmitter.event,
        end: () => {
          messageWriter.end();
        },
        dispose: () => {
          if (isDisposed()) {
            return;
          }
          state = ConnectionState.Disposed;
          disposeEmitter.fire(void 0);
          const error = new messages_1.ResponseError(messages_1.ErrorCodes.PendingResponseRejected, "Pending response rejected since connection got disposed");
          for (const promise of responsePromises.values()) {
            promise.reject(error);
          }
          responsePromises = /* @__PURE__ */ new Map();
          requestTokens = /* @__PURE__ */ new Map();
          knownCanceledRequests = /* @__PURE__ */ new Set();
          messageQueue = new linkedMap_1.LinkedMap();
          if (Is2.func(messageWriter.dispose)) {
            messageWriter.dispose();
          }
          if (Is2.func(messageReader.dispose)) {
            messageReader.dispose();
          }
        },
        listen: () => {
          throwIfClosedOrDisposed();
          throwIfListening();
          state = ConnectionState.Listening;
          messageReader.listen(callback);
        },
        inspect: () => {
          (0, ral_1.default)().console.log("inspect");
        }
      };
      connection.onNotification(LogTraceNotification.type, (params) => {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        const verbose = trace === Trace.Verbose || trace === Trace.Compact;
        tracer.log(params.message, verbose ? params.verbose : void 0);
      });
      connection.onNotification(ProgressNotification.type, async (params) => {
        const handler = progressHandlers.get(params.token);
        if (handler) {
          await handler(params.value);
        } else {
          unhandledProgressEmitter.fire(params);
        }
      });
      return connection;
    }
  }
});

// ../node_modules/vscode-jsonrpc/lib/common/api.js
var require_api = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/common/api.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProgressType = exports2.ProgressToken = exports2.createMessageConnection = exports2.NullLogger = exports2.ConnectionOptions = exports2.ConnectionStrategy = exports2.AbstractMessageBuffer = exports2.WriteableStreamMessageWriter = exports2.AbstractMessageWriter = exports2.MessageWriter = exports2.ReadableStreamMessageReader = exports2.AbstractMessageReader = exports2.MessageReader = exports2.SharedArrayReceiverStrategy = exports2.SharedArraySenderStrategy = exports2.CancellationToken = exports2.CancellationTokenSource = exports2.Emitter = exports2.Event = exports2.Disposable = exports2.LRUCache = exports2.Touch = exports2.LinkedMap = exports2.ParameterStructures = exports2.NotificationType9 = exports2.NotificationType8 = exports2.NotificationType7 = exports2.NotificationType6 = exports2.NotificationType5 = exports2.NotificationType4 = exports2.NotificationType3 = exports2.NotificationType2 = exports2.NotificationType1 = exports2.NotificationType0 = exports2.NotificationType = exports2.ErrorCodes = exports2.ResponseError = exports2.RequestType9 = exports2.RequestType8 = exports2.RequestType7 = exports2.RequestType6 = exports2.RequestType5 = exports2.RequestType4 = exports2.RequestType3 = exports2.RequestType2 = exports2.RequestType1 = exports2.RequestType0 = exports2.RequestType = exports2.Message = exports2.RAL = void 0;
    exports2.MessageStrategy = exports2.CancellationStrategy = exports2.CancellationSenderStrategy = exports2.RequestCancellationReceiverStrategy = exports2.IdCancellationReceiverStrategy = exports2.CancellationReceiverStrategy = exports2.ConnectionError = exports2.ConnectionErrors = exports2.LogTraceNotification = exports2.SetTraceNotification = exports2.TraceFormat = exports2.TraceValues = exports2.TraceValue = exports2.Trace = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports2, "Message", { enumerable: true, get: function() {
      return messages_1.Message;
    } });
    Object.defineProperty(exports2, "RequestType", { enumerable: true, get: function() {
      return messages_1.RequestType;
    } });
    Object.defineProperty(exports2, "RequestType0", { enumerable: true, get: function() {
      return messages_1.RequestType0;
    } });
    Object.defineProperty(exports2, "RequestType1", { enumerable: true, get: function() {
      return messages_1.RequestType1;
    } });
    Object.defineProperty(exports2, "RequestType2", { enumerable: true, get: function() {
      return messages_1.RequestType2;
    } });
    Object.defineProperty(exports2, "RequestType3", { enumerable: true, get: function() {
      return messages_1.RequestType3;
    } });
    Object.defineProperty(exports2, "RequestType4", { enumerable: true, get: function() {
      return messages_1.RequestType4;
    } });
    Object.defineProperty(exports2, "RequestType5", { enumerable: true, get: function() {
      return messages_1.RequestType5;
    } });
    Object.defineProperty(exports2, "RequestType6", { enumerable: true, get: function() {
      return messages_1.RequestType6;
    } });
    Object.defineProperty(exports2, "RequestType7", { enumerable: true, get: function() {
      return messages_1.RequestType7;
    } });
    Object.defineProperty(exports2, "RequestType8", { enumerable: true, get: function() {
      return messages_1.RequestType8;
    } });
    Object.defineProperty(exports2, "RequestType9", { enumerable: true, get: function() {
      return messages_1.RequestType9;
    } });
    Object.defineProperty(exports2, "ResponseError", { enumerable: true, get: function() {
      return messages_1.ResponseError;
    } });
    Object.defineProperty(exports2, "ErrorCodes", { enumerable: true, get: function() {
      return messages_1.ErrorCodes;
    } });
    Object.defineProperty(exports2, "NotificationType", { enumerable: true, get: function() {
      return messages_1.NotificationType;
    } });
    Object.defineProperty(exports2, "NotificationType0", { enumerable: true, get: function() {
      return messages_1.NotificationType0;
    } });
    Object.defineProperty(exports2, "NotificationType1", { enumerable: true, get: function() {
      return messages_1.NotificationType1;
    } });
    Object.defineProperty(exports2, "NotificationType2", { enumerable: true, get: function() {
      return messages_1.NotificationType2;
    } });
    Object.defineProperty(exports2, "NotificationType3", { enumerable: true, get: function() {
      return messages_1.NotificationType3;
    } });
    Object.defineProperty(exports2, "NotificationType4", { enumerable: true, get: function() {
      return messages_1.NotificationType4;
    } });
    Object.defineProperty(exports2, "NotificationType5", { enumerable: true, get: function() {
      return messages_1.NotificationType5;
    } });
    Object.defineProperty(exports2, "NotificationType6", { enumerable: true, get: function() {
      return messages_1.NotificationType6;
    } });
    Object.defineProperty(exports2, "NotificationType7", { enumerable: true, get: function() {
      return messages_1.NotificationType7;
    } });
    Object.defineProperty(exports2, "NotificationType8", { enumerable: true, get: function() {
      return messages_1.NotificationType8;
    } });
    Object.defineProperty(exports2, "NotificationType9", { enumerable: true, get: function() {
      return messages_1.NotificationType9;
    } });
    Object.defineProperty(exports2, "ParameterStructures", { enumerable: true, get: function() {
      return messages_1.ParameterStructures;
    } });
    var linkedMap_1 = require_linkedMap();
    Object.defineProperty(exports2, "LinkedMap", { enumerable: true, get: function() {
      return linkedMap_1.LinkedMap;
    } });
    Object.defineProperty(exports2, "LRUCache", { enumerable: true, get: function() {
      return linkedMap_1.LRUCache;
    } });
    Object.defineProperty(exports2, "Touch", { enumerable: true, get: function() {
      return linkedMap_1.Touch;
    } });
    var disposable_1 = require_disposable();
    Object.defineProperty(exports2, "Disposable", { enumerable: true, get: function() {
      return disposable_1.Disposable;
    } });
    var events_1 = require_events();
    Object.defineProperty(exports2, "Event", { enumerable: true, get: function() {
      return events_1.Event;
    } });
    Object.defineProperty(exports2, "Emitter", { enumerable: true, get: function() {
      return events_1.Emitter;
    } });
    var cancellation_1 = require_cancellation();
    Object.defineProperty(exports2, "CancellationTokenSource", { enumerable: true, get: function() {
      return cancellation_1.CancellationTokenSource;
    } });
    Object.defineProperty(exports2, "CancellationToken", { enumerable: true, get: function() {
      return cancellation_1.CancellationToken;
    } });
    var sharedArrayCancellation_1 = require_sharedArrayCancellation();
    Object.defineProperty(exports2, "SharedArraySenderStrategy", { enumerable: true, get: function() {
      return sharedArrayCancellation_1.SharedArraySenderStrategy;
    } });
    Object.defineProperty(exports2, "SharedArrayReceiverStrategy", { enumerable: true, get: function() {
      return sharedArrayCancellation_1.SharedArrayReceiverStrategy;
    } });
    var messageReader_1 = require_messageReader();
    Object.defineProperty(exports2, "MessageReader", { enumerable: true, get: function() {
      return messageReader_1.MessageReader;
    } });
    Object.defineProperty(exports2, "AbstractMessageReader", { enumerable: true, get: function() {
      return messageReader_1.AbstractMessageReader;
    } });
    Object.defineProperty(exports2, "ReadableStreamMessageReader", { enumerable: true, get: function() {
      return messageReader_1.ReadableStreamMessageReader;
    } });
    var messageWriter_1 = require_messageWriter();
    Object.defineProperty(exports2, "MessageWriter", { enumerable: true, get: function() {
      return messageWriter_1.MessageWriter;
    } });
    Object.defineProperty(exports2, "AbstractMessageWriter", { enumerable: true, get: function() {
      return messageWriter_1.AbstractMessageWriter;
    } });
    Object.defineProperty(exports2, "WriteableStreamMessageWriter", { enumerable: true, get: function() {
      return messageWriter_1.WriteableStreamMessageWriter;
    } });
    var messageBuffer_1 = require_messageBuffer();
    Object.defineProperty(exports2, "AbstractMessageBuffer", { enumerable: true, get: function() {
      return messageBuffer_1.AbstractMessageBuffer;
    } });
    var connection_1 = require_connection();
    Object.defineProperty(exports2, "ConnectionStrategy", { enumerable: true, get: function() {
      return connection_1.ConnectionStrategy;
    } });
    Object.defineProperty(exports2, "ConnectionOptions", { enumerable: true, get: function() {
      return connection_1.ConnectionOptions;
    } });
    Object.defineProperty(exports2, "NullLogger", { enumerable: true, get: function() {
      return connection_1.NullLogger;
    } });
    Object.defineProperty(exports2, "createMessageConnection", { enumerable: true, get: function() {
      return connection_1.createMessageConnection;
    } });
    Object.defineProperty(exports2, "ProgressToken", { enumerable: true, get: function() {
      return connection_1.ProgressToken;
    } });
    Object.defineProperty(exports2, "ProgressType", { enumerable: true, get: function() {
      return connection_1.ProgressType;
    } });
    Object.defineProperty(exports2, "Trace", { enumerable: true, get: function() {
      return connection_1.Trace;
    } });
    Object.defineProperty(exports2, "TraceValue", { enumerable: true, get: function() {
      return connection_1.TraceValue;
    } });
    Object.defineProperty(exports2, "TraceFormat", { enumerable: true, get: function() {
      return connection_1.TraceFormat;
    } });
    Object.defineProperty(exports2, "SetTraceNotification", { enumerable: true, get: function() {
      return connection_1.SetTraceNotification;
    } });
    Object.defineProperty(exports2, "LogTraceNotification", { enumerable: true, get: function() {
      return connection_1.LogTraceNotification;
    } });
    Object.defineProperty(exports2, "ConnectionErrors", { enumerable: true, get: function() {
      return connection_1.ConnectionErrors;
    } });
    Object.defineProperty(exports2, "ConnectionError", { enumerable: true, get: function() {
      return connection_1.ConnectionError;
    } });
    Object.defineProperty(exports2, "CancellationReceiverStrategy", { enumerable: true, get: function() {
      return connection_1.CancellationReceiverStrategy;
    } });
    Object.defineProperty(exports2, "IdCancellationReceiverStrategy", { enumerable: true, get: function() {
      return connection_1.IdCancellationReceiverStrategy;
    } });
    Object.defineProperty(exports2, "RequestCancellationReceiverStrategy", { enumerable: true, get: function() {
      return connection_1.RequestCancellationReceiverStrategy;
    } });
    Object.defineProperty(exports2, "CancellationSenderStrategy", { enumerable: true, get: function() {
      return connection_1.CancellationSenderStrategy;
    } });
    Object.defineProperty(exports2, "CancellationStrategy", { enumerable: true, get: function() {
      return connection_1.CancellationStrategy;
    } });
    Object.defineProperty(exports2, "MessageStrategy", { enumerable: true, get: function() {
      return connection_1.MessageStrategy;
    } });
    Object.defineProperty(exports2, "TraceValues", { enumerable: true, get: function() {
      return connection_1.TraceValues;
    } });
    var ral_1 = __importDefault(require_ral());
    exports2.RAL = ral_1.default;
  }
});

// ../node_modules/vscode-languageserver-types/lib/esm/main.js
var main_exports = {};
__export(main_exports, {
  AnnotatedTextEdit: () => AnnotatedTextEdit,
  ApplyKind: () => ApplyKind,
  ChangeAnnotation: () => ChangeAnnotation,
  ChangeAnnotationIdentifier: () => ChangeAnnotationIdentifier,
  CodeAction: () => CodeAction,
  CodeActionContext: () => CodeActionContext,
  CodeActionKind: () => CodeActionKind,
  CodeActionTag: () => CodeActionTag,
  CodeActionTriggerKind: () => CodeActionTriggerKind,
  CodeDescription: () => CodeDescription,
  CodeLens: () => CodeLens,
  Color: () => Color,
  ColorInformation: () => ColorInformation,
  ColorPresentation: () => ColorPresentation,
  Command: () => Command,
  CompletionItem: () => CompletionItem,
  CompletionItemKind: () => CompletionItemKind,
  CompletionItemLabelDetails: () => CompletionItemLabelDetails,
  CompletionItemTag: () => CompletionItemTag,
  CompletionList: () => CompletionList,
  CreateFile: () => CreateFile,
  DeleteFile: () => DeleteFile,
  Diagnostic: () => Diagnostic,
  DiagnosticRelatedInformation: () => DiagnosticRelatedInformation,
  DiagnosticSeverity: () => DiagnosticSeverity,
  DiagnosticTag: () => DiagnosticTag,
  DocumentHighlight: () => DocumentHighlight,
  DocumentHighlightKind: () => DocumentHighlightKind,
  DocumentLink: () => DocumentLink,
  DocumentSymbol: () => DocumentSymbol,
  DocumentUri: () => DocumentUri,
  EOL: () => EOL,
  FoldingRange: () => FoldingRange,
  FoldingRangeKind: () => FoldingRangeKind,
  FormattingOptions: () => FormattingOptions,
  Hover: () => Hover,
  InlayHint: () => InlayHint,
  InlayHintKind: () => InlayHintKind,
  InlayHintLabelPart: () => InlayHintLabelPart,
  InlineCompletionContext: () => InlineCompletionContext,
  InlineCompletionItem: () => InlineCompletionItem,
  InlineCompletionList: () => InlineCompletionList,
  InlineCompletionTriggerKind: () => InlineCompletionTriggerKind,
  InlineValueContext: () => InlineValueContext,
  InlineValueEvaluatableExpression: () => InlineValueEvaluatableExpression,
  InlineValueText: () => InlineValueText,
  InlineValueVariableLookup: () => InlineValueVariableLookup,
  InsertReplaceEdit: () => InsertReplaceEdit,
  InsertTextFormat: () => InsertTextFormat,
  InsertTextMode: () => InsertTextMode,
  LanguageKind: () => LanguageKind,
  Location: () => Location,
  LocationLink: () => LocationLink,
  MarkedString: () => MarkedString,
  MarkupContent: () => MarkupContent,
  MarkupKind: () => MarkupKind,
  OptionalVersionedTextDocumentIdentifier: () => OptionalVersionedTextDocumentIdentifier,
  ParameterInformation: () => ParameterInformation,
  Position: () => Position,
  Range: () => Range,
  RenameFile: () => RenameFile,
  SelectedCompletionInfo: () => SelectedCompletionInfo,
  SelectionRange: () => SelectionRange,
  SemanticTokenModifiers: () => SemanticTokenModifiers,
  SemanticTokenTypes: () => SemanticTokenTypes,
  SemanticTokens: () => SemanticTokens,
  SignatureInformation: () => SignatureInformation,
  SnippetTextEdit: () => SnippetTextEdit,
  StringValue: () => StringValue,
  SymbolInformation: () => SymbolInformation,
  SymbolKind: () => SymbolKind,
  SymbolTag: () => SymbolTag,
  TextDocument: () => TextDocument2,
  TextDocumentEdit: () => TextDocumentEdit,
  TextDocumentIdentifier: () => TextDocumentIdentifier,
  TextDocumentItem: () => TextDocumentItem,
  TextEdit: () => TextEdit,
  URI: () => URI,
  VersionedTextDocumentIdentifier: () => VersionedTextDocumentIdentifier,
  WorkspaceChange: () => WorkspaceChange,
  WorkspaceEdit: () => WorkspaceEdit,
  WorkspaceFolder: () => WorkspaceFolder,
  WorkspaceSymbol: () => WorkspaceSymbol,
  integer: () => integer,
  uinteger: () => uinteger
});
var DocumentUri, URI, integer, uinteger, Position, Range, Location, LocationLink, Color, ColorInformation, ColorPresentation, FoldingRangeKind, FoldingRange, DiagnosticRelatedInformation, DiagnosticSeverity, DiagnosticTag, CodeDescription, Diagnostic, Command, TextEdit, ChangeAnnotation, ChangeAnnotationIdentifier, AnnotatedTextEdit, TextDocumentEdit, CreateFile, RenameFile, DeleteFile, WorkspaceEdit, TextEditChangeImpl, SnippetTextEdit, ChangeAnnotations, WorkspaceChange, TextDocumentIdentifier, VersionedTextDocumentIdentifier, OptionalVersionedTextDocumentIdentifier, LanguageKind, TextDocumentItem, MarkupKind, MarkupContent, CompletionItemKind, InsertTextFormat, CompletionItemTag, InsertReplaceEdit, InsertTextMode, ApplyKind, CompletionItemLabelDetails, CompletionItem, CompletionList, MarkedString, Hover, ParameterInformation, SignatureInformation, DocumentHighlightKind, DocumentHighlight, SymbolKind, SymbolTag, SymbolInformation, WorkspaceSymbol, DocumentSymbol, CodeActionKind, CodeActionTriggerKind, CodeActionContext, CodeActionTag, CodeAction, CodeLens, FormattingOptions, DocumentLink, SelectionRange, SemanticTokenTypes, SemanticTokenModifiers, SemanticTokens, InlineValueText, InlineValueVariableLookup, InlineValueEvaluatableExpression, InlineValueContext, InlayHintKind, InlayHintLabelPart, InlayHint, StringValue, InlineCompletionItem, InlineCompletionList, InlineCompletionTriggerKind, SelectedCompletionInfo, InlineCompletionContext, WorkspaceFolder, EOL, TextDocument2, FullTextDocument2, Is;
var init_main = __esm({
  "../node_modules/vscode-languageserver-types/lib/esm/main.js"() {
    "use strict";
    (function(DocumentUri2) {
      function is(value) {
        return typeof value === "string";
      }
      DocumentUri2.is = is;
    })(DocumentUri || (DocumentUri = {}));
    (function(URI2) {
      function is(value) {
        return typeof value === "string";
      }
      URI2.is = is;
    })(URI || (URI = {}));
    (function(integer2) {
      integer2.MIN_VALUE = -2147483648;
      integer2.MAX_VALUE = 2147483647;
      function is(value) {
        return typeof value === "number" && integer2.MIN_VALUE <= value && value <= integer2.MAX_VALUE;
      }
      integer2.is = is;
    })(integer || (integer = {}));
    (function(uinteger2) {
      uinteger2.MIN_VALUE = 0;
      uinteger2.MAX_VALUE = 2147483647;
      function is(value) {
        return typeof value === "number" && uinteger2.MIN_VALUE <= value && value <= uinteger2.MAX_VALUE;
      }
      uinteger2.is = is;
    })(uinteger || (uinteger = {}));
    (function(Position3) {
      function create(line2, character) {
        if (line2 === Number.MAX_VALUE) {
          line2 = uinteger.MAX_VALUE;
        }
        if (character === Number.MAX_VALUE) {
          character = uinteger.MAX_VALUE;
        }
        return { line: line2, character };
      }
      Position3.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Is.uinteger(candidate.line) && Is.uinteger(candidate.character);
      }
      Position3.is = is;
    })(Position || (Position = {}));
    (function(Range2) {
      function create(one, two, three, four) {
        if (Is.uinteger(one) && Is.uinteger(two) && Is.uinteger(three) && Is.uinteger(four)) {
          return { start: Position.create(one, two), end: Position.create(three, four) };
        } else if (Position.is(one) && Position.is(two)) {
          return { start: one, end: two };
        } else {
          throw new Error(`Range#create called with invalid arguments[${one}, ${two}, ${three}, ${four}]`);
        }
      }
      Range2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Position.is(candidate.start) && Position.is(candidate.end);
      }
      Range2.is = is;
    })(Range || (Range = {}));
    (function(Location2) {
      function create(uri, range) {
        return { uri, range };
      }
      Location2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Range.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
      }
      Location2.is = is;
    })(Location || (Location = {}));
    (function(LocationLink2) {
      function create(targetUri, targetRange, targetSelectionRange, originSelectionRange) {
        return { targetUri, targetRange, targetSelectionRange, originSelectionRange };
      }
      LocationLink2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Range.is(candidate.targetRange) && Is.string(candidate.targetUri) && Range.is(candidate.targetSelectionRange) && (Range.is(candidate.originSelectionRange) || Is.undefined(candidate.originSelectionRange));
      }
      LocationLink2.is = is;
    })(LocationLink || (LocationLink = {}));
    (function(Color2) {
      function create(red, green, blue, alpha) {
        return {
          red,
          green,
          blue,
          alpha
        };
      }
      Color2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Is.numberRange(candidate.red, 0, 1) && Is.numberRange(candidate.green, 0, 1) && Is.numberRange(candidate.blue, 0, 1) && Is.numberRange(candidate.alpha, 0, 1);
      }
      Color2.is = is;
    })(Color || (Color = {}));
    (function(ColorInformation2) {
      function create(range, color) {
        return {
          range,
          color
        };
      }
      ColorInformation2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Range.is(candidate.range) && Color.is(candidate.color);
      }
      ColorInformation2.is = is;
    })(ColorInformation || (ColorInformation = {}));
    (function(ColorPresentation2) {
      function create(label, textEdit, additionalTextEdits) {
        return {
          label,
          textEdit,
          additionalTextEdits
        };
      }
      ColorPresentation2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.undefined(candidate.textEdit) || TextEdit.is(candidate)) && (Is.undefined(candidate.additionalTextEdits) || Is.typedArray(candidate.additionalTextEdits, TextEdit.is));
      }
      ColorPresentation2.is = is;
    })(ColorPresentation || (ColorPresentation = {}));
    (function(FoldingRangeKind2) {
      FoldingRangeKind2.Comment = "comment";
      FoldingRangeKind2.Imports = "imports";
      FoldingRangeKind2.Region = "region";
    })(FoldingRangeKind || (FoldingRangeKind = {}));
    (function(FoldingRange2) {
      function create(startLine, endLine, startCharacter, endCharacter, kind, collapsedText) {
        const result = {
          startLine,
          endLine
        };
        if (Is.defined(startCharacter)) {
          result.startCharacter = startCharacter;
        }
        if (Is.defined(endCharacter)) {
          result.endCharacter = endCharacter;
        }
        if (Is.defined(kind)) {
          result.kind = kind;
        }
        if (Is.defined(collapsedText)) {
          result.collapsedText = collapsedText;
        }
        return result;
      }
      FoldingRange2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Is.uinteger(candidate.startLine) && Is.uinteger(candidate.startLine) && (Is.undefined(candidate.startCharacter) || Is.uinteger(candidate.startCharacter)) && (Is.undefined(candidate.endCharacter) || Is.uinteger(candidate.endCharacter)) && (Is.undefined(candidate.kind) || Is.string(candidate.kind));
      }
      FoldingRange2.is = is;
    })(FoldingRange || (FoldingRange = {}));
    (function(DiagnosticRelatedInformation2) {
      function create(location, message) {
        return {
          location,
          message
        };
      }
      DiagnosticRelatedInformation2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
      }
      DiagnosticRelatedInformation2.is = is;
    })(DiagnosticRelatedInformation || (DiagnosticRelatedInformation = {}));
    (function(DiagnosticSeverity3) {
      DiagnosticSeverity3.Error = 1;
      DiagnosticSeverity3.Warning = 2;
      DiagnosticSeverity3.Information = 3;
      DiagnosticSeverity3.Hint = 4;
    })(DiagnosticSeverity || (DiagnosticSeverity = {}));
    (function(DiagnosticTag2) {
      DiagnosticTag2.Unnecessary = 1;
      DiagnosticTag2.Deprecated = 2;
    })(DiagnosticTag || (DiagnosticTag = {}));
    (function(CodeDescription2) {
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Is.string(candidate.href);
      }
      CodeDescription2.is = is;
    })(CodeDescription || (CodeDescription = {}));
    (function(Diagnostic3) {
      function create(range, message, severity, code, source, relatedInformation) {
        const result = { range, message };
        if (Is.defined(severity)) {
          result.severity = severity;
        }
        if (Is.defined(code)) {
          result.code = code;
        }
        if (Is.defined(source)) {
          result.source = source;
        }
        if (Is.defined(relatedInformation)) {
          result.relatedInformation = relatedInformation;
        }
        return result;
      }
      Diagnostic3.create = create;
      function is(value) {
        var _a;
        const candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.string(candidate.message) || MarkupContent.is(candidate.message)) && (Is.number(candidate.severity) || Is.undefined(candidate.severity)) && (Is.integer(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code)) && (Is.undefined(candidate.codeDescription) || Is.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)) && (Is.string(candidate.source) || Is.undefined(candidate.source)) && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
      }
      Diagnostic3.is = is;
      function is3_17(value) {
        return Is.string(value.message);
      }
      Diagnostic3.is3_17 = is3_17;
      function getMessageString(diagnostic) {
        if (Is.string(diagnostic.message)) {
          return diagnostic.message;
        } else if (MarkupContent.is(diagnostic.message)) {
          return diagnostic.message.value;
        } else {
          throw new Error(`Unknown message type ${typeof diagnostic.message}`);
        }
      }
      Diagnostic3.getMessageString = getMessageString;
    })(Diagnostic || (Diagnostic = {}));
    (function(Command2) {
      function create(title, command, ...args) {
        const result = { title, command };
        if (Is.defined(args) && args.length > 0) {
          result.arguments = args;
        }
        return result;
      }
      Command2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.string(candidate.title) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip)) && Is.string(candidate.command);
      }
      Command2.is = is;
    })(Command || (Command = {}));
    (function(TextEdit2) {
      function replace(range, newText) {
        return { range, newText };
      }
      TextEdit2.replace = replace;
      function insert(position, newText) {
        return { range: { start: position, end: position }, newText };
      }
      TextEdit2.insert = insert;
      function del(range) {
        return { range, newText: "" };
      }
      TextEdit2.del = del;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Is.string(candidate.newText) && Range.is(candidate.range);
      }
      TextEdit2.is = is;
    })(TextEdit || (TextEdit = {}));
    (function(ChangeAnnotation2) {
      function create(label, needsConfirmation, description) {
        const result = { label };
        if (needsConfirmation !== void 0) {
          result.needsConfirmation = needsConfirmation;
        }
        if (description !== void 0) {
          result.description = description;
        }
        return result;
      }
      ChangeAnnotation2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
      }
      ChangeAnnotation2.is = is;
    })(ChangeAnnotation || (ChangeAnnotation = {}));
    (function(ChangeAnnotationIdentifier2) {
      function is(value) {
        const candidate = value;
        return Is.string(candidate);
      }
      ChangeAnnotationIdentifier2.is = is;
    })(ChangeAnnotationIdentifier || (ChangeAnnotationIdentifier = {}));
    (function(AnnotatedTextEdit2) {
      function replace(range, newText, annotation) {
        return { range, newText, annotationId: annotation };
      }
      AnnotatedTextEdit2.replace = replace;
      function insert(position, newText, annotation) {
        return { range: { start: position, end: position }, newText, annotationId: annotation };
      }
      AnnotatedTextEdit2.insert = insert;
      function del(range, annotation) {
        return { range, newText: "", annotationId: annotation };
      }
      AnnotatedTextEdit2.del = del;
      function is(value) {
        const candidate = value;
        return TextEdit.is(candidate) && (ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId));
      }
      AnnotatedTextEdit2.is = is;
    })(AnnotatedTextEdit || (AnnotatedTextEdit = {}));
    (function(TextDocumentEdit2) {
      function create(textDocument, edits) {
        return { textDocument, edits };
      }
      TextDocumentEdit2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && OptionalVersionedTextDocumentIdentifier.is(candidate.textDocument) && Array.isArray(candidate.edits);
      }
      TextDocumentEdit2.is = is;
    })(TextDocumentEdit || (TextDocumentEdit = {}));
    (function(CreateFile2) {
      function create(uri, options, annotation) {
        const result = {
          kind: "create",
          uri
        };
        if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
          result.options = options;
        }
        if (annotation !== void 0) {
          result.annotationId = annotation;
        }
        return result;
      }
      CreateFile2.create = create;
      function is(value) {
        const candidate = value;
        return candidate && candidate.kind === "create" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
      }
      CreateFile2.is = is;
    })(CreateFile || (CreateFile = {}));
    (function(RenameFile2) {
      function create(oldUri, newUri, options, annotation) {
        const result = {
          kind: "rename",
          oldUri,
          newUri
        };
        if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
          result.options = options;
        }
        if (annotation !== void 0) {
          result.annotationId = annotation;
        }
        return result;
      }
      RenameFile2.create = create;
      function is(value) {
        const candidate = value;
        return candidate && candidate.kind === "rename" && Is.string(candidate.oldUri) && Is.string(candidate.newUri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
      }
      RenameFile2.is = is;
    })(RenameFile || (RenameFile = {}));
    (function(DeleteFile2) {
      function create(uri, options, annotation) {
        const result = {
          kind: "delete",
          uri
        };
        if (options !== void 0 && (options.recursive !== void 0 || options.ignoreIfNotExists !== void 0)) {
          result.options = options;
        }
        if (annotation !== void 0) {
          result.annotationId = annotation;
        }
        return result;
      }
      DeleteFile2.create = create;
      function is(value) {
        const candidate = value;
        return candidate && candidate.kind === "delete" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.recursive === void 0 || Is.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === void 0 || Is.boolean(candidate.options.ignoreIfNotExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
      }
      DeleteFile2.is = is;
    })(DeleteFile || (DeleteFile = {}));
    (function(WorkspaceEdit2) {
      function is(value) {
        const candidate = value;
        return candidate && (candidate.changes !== void 0 || candidate.documentChanges !== void 0) && (candidate.documentChanges === void 0 || candidate.documentChanges.every((change) => {
          if (Is.string(change.kind)) {
            return CreateFile.is(change) || RenameFile.is(change) || DeleteFile.is(change);
          } else {
            return TextDocumentEdit.is(change);
          }
        }));
      }
      WorkspaceEdit2.is = is;
    })(WorkspaceEdit || (WorkspaceEdit = {}));
    TextEditChangeImpl = class {
      constructor(edits, changeAnnotations) {
        this.edits = edits;
        this.changeAnnotations = changeAnnotations;
      }
      insert(position, newText, annotation) {
        let edit;
        let id;
        if (annotation === void 0) {
          edit = TextEdit.insert(position, newText);
        } else if (ChangeAnnotationIdentifier.is(annotation)) {
          id = annotation;
          edit = AnnotatedTextEdit.insert(position, newText, annotation);
        } else {
          this.assertChangeAnnotations(this.changeAnnotations);
          id = this.changeAnnotations.manage(annotation);
          edit = AnnotatedTextEdit.insert(position, newText, id);
        }
        this.edits.push(edit);
        if (id !== void 0) {
          return id;
        }
      }
      replace(range, newText, annotation) {
        let edit;
        let id;
        if (annotation === void 0) {
          edit = TextEdit.replace(range, newText);
        } else if (ChangeAnnotationIdentifier.is(annotation)) {
          id = annotation;
          edit = AnnotatedTextEdit.replace(range, newText, annotation);
        } else {
          this.assertChangeAnnotations(this.changeAnnotations);
          id = this.changeAnnotations.manage(annotation);
          edit = AnnotatedTextEdit.replace(range, newText, id);
        }
        this.edits.push(edit);
        if (id !== void 0) {
          return id;
        }
      }
      delete(range, annotation) {
        let edit;
        let id;
        if (annotation === void 0) {
          edit = TextEdit.del(range);
        } else if (ChangeAnnotationIdentifier.is(annotation)) {
          id = annotation;
          edit = AnnotatedTextEdit.del(range, annotation);
        } else {
          this.assertChangeAnnotations(this.changeAnnotations);
          id = this.changeAnnotations.manage(annotation);
          edit = AnnotatedTextEdit.del(range, id);
        }
        this.edits.push(edit);
        if (id !== void 0) {
          return id;
        }
      }
      add(edit) {
        this.edits.push(edit);
      }
      all() {
        return this.edits;
      }
      clear() {
        this.edits.splice(0, this.edits.length);
      }
      assertChangeAnnotations(value) {
        if (value === void 0) {
          throw new Error(`Text edit change is not configured to manage change annotations.`);
        }
      }
    };
    (function(SnippetTextEdit2) {
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Range.is(candidate.range) && StringValue.isSnippet(candidate.snippet) && (candidate.annotationId === void 0 || (ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId)));
      }
      SnippetTextEdit2.is = is;
    })(SnippetTextEdit || (SnippetTextEdit = {}));
    ChangeAnnotations = class {
      constructor(annotations) {
        this._annotations = annotations === void 0 ? /* @__PURE__ */ Object.create(null) : annotations;
        this._counter = 0;
        this._size = 0;
      }
      all() {
        return this._annotations;
      }
      get size() {
        return this._size;
      }
      manage(idOrAnnotation, annotation) {
        let id;
        if (ChangeAnnotationIdentifier.is(idOrAnnotation)) {
          id = idOrAnnotation;
        } else {
          id = this.nextId();
          annotation = idOrAnnotation;
        }
        if (this._annotations[id] !== void 0) {
          throw new Error(`Id ${id} is already in use.`);
        }
        if (annotation === void 0) {
          throw new Error(`No annotation provided for id ${id}`);
        }
        this._annotations[id] = annotation;
        this._size++;
        return id;
      }
      nextId() {
        this._counter++;
        return this._counter.toString();
      }
    };
    WorkspaceChange = class {
      constructor(workspaceEdit) {
        this._textEditChanges = /* @__PURE__ */ Object.create(null);
        if (workspaceEdit !== void 0) {
          this._workspaceEdit = workspaceEdit;
          if (workspaceEdit.documentChanges) {
            this._changeAnnotations = new ChangeAnnotations(workspaceEdit.changeAnnotations);
            workspaceEdit.changeAnnotations = this._changeAnnotations.all();
            workspaceEdit.documentChanges.forEach((change) => {
              if (TextDocumentEdit.is(change)) {
                const textEditChange = new TextEditChangeImpl(change.edits, this._changeAnnotations);
                this._textEditChanges[change.textDocument.uri] = textEditChange;
              }
            });
          } else if (workspaceEdit.changes) {
            Object.keys(workspaceEdit.changes).forEach((key) => {
              const textEditChange = new TextEditChangeImpl(workspaceEdit.changes[key]);
              this._textEditChanges[key] = textEditChange;
            });
          }
        } else {
          this._workspaceEdit = {};
        }
      }
      /**
       * Returns the underlying {@link WorkspaceEdit} literal
       * use to be returned from a workspace edit operation like rename.
       */
      get edit() {
        this.initDocumentChanges();
        if (this._changeAnnotations !== void 0) {
          if (this._changeAnnotations.size === 0) {
            this._workspaceEdit.changeAnnotations = void 0;
          } else {
            this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
          }
        }
        return this._workspaceEdit;
      }
      getTextEditChange(key) {
        if (OptionalVersionedTextDocumentIdentifier.is(key)) {
          this.initDocumentChanges();
          if (this._workspaceEdit.documentChanges === void 0) {
            throw new Error("Workspace edit is not configured for document changes.");
          }
          const textDocument = { uri: key.uri, version: key.version };
          let result = this._textEditChanges[textDocument.uri];
          if (!result) {
            const edits = [];
            const textDocumentEdit = {
              textDocument,
              edits
            };
            this._workspaceEdit.documentChanges.push(textDocumentEdit);
            result = new TextEditChangeImpl(edits, this._changeAnnotations);
            this._textEditChanges[textDocument.uri] = result;
          }
          return result;
        } else {
          this.initChanges();
          if (this._workspaceEdit.changes === void 0) {
            throw new Error("Workspace edit is not configured for normal text edit changes.");
          }
          let result = this._textEditChanges[key];
          if (!result) {
            const edits = [];
            this._workspaceEdit.changes[key] = edits;
            result = new TextEditChangeImpl(edits);
            this._textEditChanges[key] = result;
          }
          return result;
        }
      }
      initDocumentChanges() {
        if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
          this._changeAnnotations = new ChangeAnnotations();
          this._workspaceEdit.documentChanges = [];
          this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
        }
      }
      initChanges() {
        if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
          this._workspaceEdit.changes = /* @__PURE__ */ Object.create(null);
        }
      }
      createFile(uri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === void 0) {
          throw new Error("Workspace edit is not configured for document changes.");
        }
        let annotation;
        if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
          annotation = optionsOrAnnotation;
        } else {
          options = optionsOrAnnotation;
        }
        let operation;
        let id;
        if (annotation === void 0) {
          operation = CreateFile.create(uri, options);
        } else {
          id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
          operation = CreateFile.create(uri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== void 0) {
          return id;
        }
      }
      renameFile(oldUri, newUri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === void 0) {
          throw new Error("Workspace edit is not configured for document changes.");
        }
        let annotation;
        if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
          annotation = optionsOrAnnotation;
        } else {
          options = optionsOrAnnotation;
        }
        let operation;
        let id;
        if (annotation === void 0) {
          operation = RenameFile.create(oldUri, newUri, options);
        } else {
          id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
          operation = RenameFile.create(oldUri, newUri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== void 0) {
          return id;
        }
      }
      deleteFile(uri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === void 0) {
          throw new Error("Workspace edit is not configured for document changes.");
        }
        let annotation;
        if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
          annotation = optionsOrAnnotation;
        } else {
          options = optionsOrAnnotation;
        }
        let operation;
        let id;
        if (annotation === void 0) {
          operation = DeleteFile.create(uri, options);
        } else {
          id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
          operation = DeleteFile.create(uri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== void 0) {
          return id;
        }
      }
    };
    (function(TextDocumentIdentifier2) {
      function create(uri) {
        return { uri };
      }
      TextDocumentIdentifier2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri);
      }
      TextDocumentIdentifier2.is = is;
    })(TextDocumentIdentifier || (TextDocumentIdentifier = {}));
    (function(VersionedTextDocumentIdentifier2) {
      function create(uri, version) {
        return { uri, version };
      }
      VersionedTextDocumentIdentifier2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && Is.integer(candidate.version);
      }
      VersionedTextDocumentIdentifier2.is = is;
    })(VersionedTextDocumentIdentifier || (VersionedTextDocumentIdentifier = {}));
    (function(OptionalVersionedTextDocumentIdentifier2) {
      function create(uri, version) {
        return { uri, version };
      }
      OptionalVersionedTextDocumentIdentifier2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && (candidate.version === null || Is.integer(candidate.version));
      }
      OptionalVersionedTextDocumentIdentifier2.is = is;
    })(OptionalVersionedTextDocumentIdentifier || (OptionalVersionedTextDocumentIdentifier = {}));
    (function(LanguageKind2) {
      LanguageKind2.ABAP = "abap";
      LanguageKind2.WindowsBat = "bat";
      LanguageKind2.BibTeX = "bibtex";
      LanguageKind2.Clojure = "clojure";
      LanguageKind2.Coffeescript = "coffeescript";
      LanguageKind2.C = "c";
      LanguageKind2.CPP = "cpp";
      LanguageKind2.CSharp = "csharp";
      LanguageKind2.CSS = "css";
      LanguageKind2.D = "d";
      LanguageKind2.Delphi = "pascal";
      LanguageKind2.Diff = "diff";
      LanguageKind2.Dart = "dart";
      LanguageKind2.Dockerfile = "dockerfile";
      LanguageKind2.Elixir = "elixir";
      LanguageKind2.Erlang = "erlang";
      LanguageKind2.FSharp = "fsharp";
      LanguageKind2.GitCommit = "git-commit";
      LanguageKind2.GitRebase = "git-rebase";
      LanguageKind2.Go = "go";
      LanguageKind2.Groovy = "groovy";
      LanguageKind2.Handlebars = "handlebars";
      LanguageKind2.Haskell = "haskell";
      LanguageKind2.HTML = "html";
      LanguageKind2.Ini = "ini";
      LanguageKind2.Java = "java";
      LanguageKind2.JavaScript = "javascript";
      LanguageKind2.JavaScriptReact = "javascriptreact";
      LanguageKind2.JSON = "json";
      LanguageKind2.LaTeX = "latex";
      LanguageKind2.Less = "less";
      LanguageKind2.Lua = "lua";
      LanguageKind2.Makefile = "makefile";
      LanguageKind2.Markdown = "markdown";
      LanguageKind2.ObjectiveC = "objective-c";
      LanguageKind2.ObjectiveCPP = "objective-cpp";
      LanguageKind2.Pascal = "pascal";
      LanguageKind2.Perl = "perl";
      LanguageKind2.Perl6 = "perl6";
      LanguageKind2.PHP = "php";
      LanguageKind2.Plaintext = "plaintext";
      LanguageKind2.Powershell = "powershell";
      LanguageKind2.Pug = "jade";
      LanguageKind2.Python = "python";
      LanguageKind2.R = "r";
      LanguageKind2.Razor = "razor";
      LanguageKind2.Ruby = "ruby";
      LanguageKind2.Rust = "rust";
      LanguageKind2.SCSS = "scss";
      LanguageKind2.SASS = "sass";
      LanguageKind2.Scala = "scala";
      LanguageKind2.ShaderLab = "shaderlab";
      LanguageKind2.ShellScript = "shellscript";
      LanguageKind2.SQL = "sql";
      LanguageKind2.Swift = "swift";
      LanguageKind2.TypeScript = "typescript";
      LanguageKind2.TypeScriptReact = "typescriptreact";
      LanguageKind2.TeX = "tex";
      LanguageKind2.VisualBasic = "vb";
      LanguageKind2.XML = "xml";
      LanguageKind2.XSL = "xsl";
      LanguageKind2.YAML = "yaml";
    })(LanguageKind || (LanguageKind = {}));
    (function(TextDocumentItem2) {
      function create(uri, languageId, version, text) {
        return { uri, languageId, version, text };
      }
      TextDocumentItem2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.integer(candidate.version) && Is.string(candidate.text);
      }
      TextDocumentItem2.is = is;
    })(TextDocumentItem || (TextDocumentItem = {}));
    (function(MarkupKind2) {
      MarkupKind2.PlainText = "plaintext";
      MarkupKind2.Markdown = "markdown";
      function is(value) {
        const candidate = value;
        return candidate === MarkupKind2.PlainText || candidate === MarkupKind2.Markdown;
      }
      MarkupKind2.is = is;
    })(MarkupKind || (MarkupKind = {}));
    (function(MarkupContent2) {
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(value) && MarkupKind.is(candidate.kind) && Is.string(candidate.value);
      }
      MarkupContent2.is = is;
    })(MarkupContent || (MarkupContent = {}));
    (function(CompletionItemKind3) {
      CompletionItemKind3.Text = 1;
      CompletionItemKind3.Method = 2;
      CompletionItemKind3.Function = 3;
      CompletionItemKind3.Constructor = 4;
      CompletionItemKind3.Field = 5;
      CompletionItemKind3.Variable = 6;
      CompletionItemKind3.Class = 7;
      CompletionItemKind3.Interface = 8;
      CompletionItemKind3.Module = 9;
      CompletionItemKind3.Property = 10;
      CompletionItemKind3.Unit = 11;
      CompletionItemKind3.Value = 12;
      CompletionItemKind3.Enum = 13;
      CompletionItemKind3.Keyword = 14;
      CompletionItemKind3.Snippet = 15;
      CompletionItemKind3.Color = 16;
      CompletionItemKind3.File = 17;
      CompletionItemKind3.Reference = 18;
      CompletionItemKind3.Folder = 19;
      CompletionItemKind3.EnumMember = 20;
      CompletionItemKind3.Constant = 21;
      CompletionItemKind3.Struct = 22;
      CompletionItemKind3.Event = 23;
      CompletionItemKind3.Operator = 24;
      CompletionItemKind3.TypeParameter = 25;
    })(CompletionItemKind || (CompletionItemKind = {}));
    (function(InsertTextFormat2) {
      InsertTextFormat2.PlainText = 1;
      InsertTextFormat2.Snippet = 2;
    })(InsertTextFormat || (InsertTextFormat = {}));
    (function(CompletionItemTag2) {
      CompletionItemTag2.Deprecated = 1;
    })(CompletionItemTag || (CompletionItemTag = {}));
    (function(InsertReplaceEdit2) {
      function create(newText, insert, replace) {
        return { newText, insert, replace };
      }
      InsertReplaceEdit2.create = create;
      function is(value) {
        const candidate = value;
        return candidate && Is.string(candidate.newText) && Range.is(candidate.insert) && Range.is(candidate.replace);
      }
      InsertReplaceEdit2.is = is;
    })(InsertReplaceEdit || (InsertReplaceEdit = {}));
    (function(InsertTextMode2) {
      InsertTextMode2.asIs = 1;
      InsertTextMode2.adjustIndentation = 2;
    })(InsertTextMode || (InsertTextMode = {}));
    (function(ApplyKind2) {
      ApplyKind2.Replace = 1;
      ApplyKind2.Merge = 2;
    })(ApplyKind || (ApplyKind = {}));
    (function(CompletionItemLabelDetails2) {
      function is(value) {
        const candidate = value;
        return candidate && (Is.string(candidate.detail) || candidate.detail === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
      }
      CompletionItemLabelDetails2.is = is;
    })(CompletionItemLabelDetails || (CompletionItemLabelDetails = {}));
    (function(CompletionItem3) {
      function create(label) {
        return { label };
      }
      CompletionItem3.create = create;
    })(CompletionItem || (CompletionItem = {}));
    (function(CompletionList2) {
      function create(items, isIncomplete) {
        return { items: items ? items : [], isIncomplete: !!isIncomplete };
      }
      CompletionList2.create = create;
    })(CompletionList || (CompletionList = {}));
    (function(MarkedString2) {
      function fromPlainText(plainText) {
        return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
      }
      MarkedString2.fromPlainText = fromPlainText;
      function is(value) {
        const candidate = value;
        return Is.string(candidate) || Is.objectLiteral(candidate) && Is.string(candidate.language) && Is.string(candidate.value);
      }
      MarkedString2.is = is;
    })(MarkedString || (MarkedString = {}));
    (function(Hover2) {
      function is(value) {
        const candidate = value;
        return !!candidate && Is.objectLiteral(candidate) && (MarkupContent.is(candidate.contents) || MarkedString.is(candidate.contents) || Is.typedArray(candidate.contents, MarkedString.is)) && (value.range === void 0 || Range.is(value.range));
      }
      Hover2.is = is;
    })(Hover || (Hover = {}));
    (function(ParameterInformation2) {
      function create(label, documentation) {
        return documentation ? { label, documentation } : { label };
      }
      ParameterInformation2.create = create;
    })(ParameterInformation || (ParameterInformation = {}));
    (function(SignatureInformation2) {
      function create(label, documentation, ...parameters) {
        const result = { label };
        if (Is.defined(documentation)) {
          result.documentation = documentation;
        }
        if (Is.defined(parameters)) {
          result.parameters = parameters;
        } else {
          result.parameters = [];
        }
        return result;
      }
      SignatureInformation2.create = create;
    })(SignatureInformation || (SignatureInformation = {}));
    (function(DocumentHighlightKind2) {
      DocumentHighlightKind2.Text = 1;
      DocumentHighlightKind2.Read = 2;
      DocumentHighlightKind2.Write = 3;
    })(DocumentHighlightKind || (DocumentHighlightKind = {}));
    (function(DocumentHighlight2) {
      function create(range, kind) {
        const result = { range };
        if (Is.number(kind)) {
          result.kind = kind;
        }
        return result;
      }
      DocumentHighlight2.create = create;
    })(DocumentHighlight || (DocumentHighlight = {}));
    (function(SymbolKind2) {
      SymbolKind2.File = 1;
      SymbolKind2.Module = 2;
      SymbolKind2.Namespace = 3;
      SymbolKind2.Package = 4;
      SymbolKind2.Class = 5;
      SymbolKind2.Method = 6;
      SymbolKind2.Property = 7;
      SymbolKind2.Field = 8;
      SymbolKind2.Constructor = 9;
      SymbolKind2.Enum = 10;
      SymbolKind2.Interface = 11;
      SymbolKind2.Function = 12;
      SymbolKind2.Variable = 13;
      SymbolKind2.Constant = 14;
      SymbolKind2.String = 15;
      SymbolKind2.Number = 16;
      SymbolKind2.Boolean = 17;
      SymbolKind2.Array = 18;
      SymbolKind2.Object = 19;
      SymbolKind2.Key = 20;
      SymbolKind2.Null = 21;
      SymbolKind2.EnumMember = 22;
      SymbolKind2.Struct = 23;
      SymbolKind2.Event = 24;
      SymbolKind2.Operator = 25;
      SymbolKind2.TypeParameter = 26;
    })(SymbolKind || (SymbolKind = {}));
    (function(SymbolTag2) {
      SymbolTag2.Deprecated = 1;
    })(SymbolTag || (SymbolTag = {}));
    (function(SymbolInformation2) {
      function create(name, kind, range, uri, containerName) {
        const result = {
          name,
          kind,
          location: { uri, range }
        };
        if (containerName) {
          result.containerName = containerName;
        }
        return result;
      }
      SymbolInformation2.create = create;
    })(SymbolInformation || (SymbolInformation = {}));
    (function(WorkspaceSymbol2) {
      function create(name, kind, uri, range) {
        return range !== void 0 ? { name, kind, location: { uri, range } } : { name, kind, location: { uri } };
      }
      WorkspaceSymbol2.create = create;
    })(WorkspaceSymbol || (WorkspaceSymbol = {}));
    (function(DocumentSymbol2) {
      function create(name, detail, kind, range, selectionRange, children) {
        const result = {
          name,
          detail,
          kind,
          range,
          selectionRange
        };
        if (children !== void 0) {
          result.children = children;
        }
        return result;
      }
      DocumentSymbol2.create = create;
      function is(value) {
        const candidate = value;
        return candidate && Is.string(candidate.name) && Is.number(candidate.kind) && Range.is(candidate.range) && Range.is(candidate.selectionRange) && (candidate.detail === void 0 || Is.string(candidate.detail)) && (candidate.deprecated === void 0 || Is.boolean(candidate.deprecated)) && (candidate.children === void 0 || Array.isArray(candidate.children)) && (candidate.tags === void 0 || Array.isArray(candidate.tags));
      }
      DocumentSymbol2.is = is;
    })(DocumentSymbol || (DocumentSymbol = {}));
    (function(CodeActionKind2) {
      CodeActionKind2.Empty = "";
      CodeActionKind2.QuickFix = "quickfix";
      CodeActionKind2.Refactor = "refactor";
      CodeActionKind2.RefactorExtract = "refactor.extract";
      CodeActionKind2.RefactorInline = "refactor.inline";
      CodeActionKind2.RefactorMove = "refactor.move";
      CodeActionKind2.RefactorRewrite = "refactor.rewrite";
      CodeActionKind2.Source = "source";
      CodeActionKind2.SourceOrganizeImports = "source.organizeImports";
      CodeActionKind2.SourceFixAll = "source.fixAll";
      CodeActionKind2.Notebook = "notebook";
    })(CodeActionKind || (CodeActionKind = {}));
    (function(CodeActionTriggerKind2) {
      CodeActionTriggerKind2.Invoked = 1;
      CodeActionTriggerKind2.Automatic = 2;
    })(CodeActionTriggerKind || (CodeActionTriggerKind = {}));
    (function(CodeActionContext2) {
      function create(diagnostics, only, triggerKind) {
        const result = { diagnostics };
        if (only !== void 0 && only !== null) {
          result.only = only;
        }
        if (triggerKind !== void 0 && triggerKind !== null) {
          result.triggerKind = triggerKind;
        }
        return result;
      }
      CodeActionContext2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is) && (candidate.only === void 0 || Is.typedArray(candidate.only, Is.string)) && (candidate.triggerKind === void 0 || candidate.triggerKind === CodeActionTriggerKind.Invoked || candidate.triggerKind === CodeActionTriggerKind.Automatic);
      }
      CodeActionContext2.is = is;
    })(CodeActionContext || (CodeActionContext = {}));
    (function(CodeActionTag2) {
      CodeActionTag2.LLMGenerated = 1;
      function is(value) {
        return Is.defined(value) && value === CodeActionTag2.LLMGenerated;
      }
      CodeActionTag2.is = is;
    })(CodeActionTag || (CodeActionTag = {}));
    (function(CodeAction2) {
      function create(title, kindOrCommandOrEdit, kind) {
        const result = { title };
        let checkKind = true;
        if (typeof kindOrCommandOrEdit === "string") {
          checkKind = false;
          result.kind = kindOrCommandOrEdit;
        } else if (Command.is(kindOrCommandOrEdit)) {
          result.command = kindOrCommandOrEdit;
        } else {
          result.edit = kindOrCommandOrEdit;
        }
        if (checkKind && kind !== void 0) {
          result.kind = kind;
        }
        return result;
      }
      CodeAction2.create = create;
      function is(value) {
        const candidate = value;
        return candidate && Is.string(candidate.title) && (candidate.diagnostics === void 0 || Is.typedArray(candidate.diagnostics, Diagnostic.is)) && (candidate.kind === void 0 || Is.string(candidate.kind)) && (candidate.edit !== void 0 || candidate.command !== void 0) && (candidate.command === void 0 || Command.is(candidate.command)) && (candidate.isPreferred === void 0 || Is.boolean(candidate.isPreferred)) && (candidate.edit === void 0 || WorkspaceEdit.is(candidate.edit)) && (candidate.tags === void 0 || Is.typedArray(candidate.tags, CodeActionTag.is));
      }
      CodeAction2.is = is;
    })(CodeAction || (CodeAction = {}));
    (function(CodeLens2) {
      function create(range, data) {
        const result = { range };
        if (Is.defined(data)) {
          result.data = data;
        }
        return result;
      }
      CodeLens2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
      }
      CodeLens2.is = is;
    })(CodeLens || (CodeLens = {}));
    (function(FormattingOptions2) {
      function create(tabSize, insertSpaces) {
        return { tabSize, insertSpaces };
      }
      FormattingOptions2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.uinteger(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
      }
      FormattingOptions2.is = is;
    })(FormattingOptions || (FormattingOptions = {}));
    (function(DocumentLink2) {
      function create(range, target, data) {
        return { range, target, data };
      }
      DocumentLink2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
      }
      DocumentLink2.is = is;
    })(DocumentLink || (DocumentLink = {}));
    (function(SelectionRange2) {
      function create(range, parent) {
        return { range, parent };
      }
      SelectionRange2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Range.is(candidate.range) && (candidate.parent === void 0 || SelectionRange2.is(candidate.parent));
      }
      SelectionRange2.is = is;
    })(SelectionRange || (SelectionRange = {}));
    (function(SemanticTokenTypes2) {
      SemanticTokenTypes2["namespace"] = "namespace";
      SemanticTokenTypes2["type"] = "type";
      SemanticTokenTypes2["class"] = "class";
      SemanticTokenTypes2["enum"] = "enum";
      SemanticTokenTypes2["interface"] = "interface";
      SemanticTokenTypes2["struct"] = "struct";
      SemanticTokenTypes2["typeParameter"] = "typeParameter";
      SemanticTokenTypes2["parameter"] = "parameter";
      SemanticTokenTypes2["variable"] = "variable";
      SemanticTokenTypes2["property"] = "property";
      SemanticTokenTypes2["enumMember"] = "enumMember";
      SemanticTokenTypes2["event"] = "event";
      SemanticTokenTypes2["function"] = "function";
      SemanticTokenTypes2["method"] = "method";
      SemanticTokenTypes2["macro"] = "macro";
      SemanticTokenTypes2["keyword"] = "keyword";
      SemanticTokenTypes2["modifier"] = "modifier";
      SemanticTokenTypes2["comment"] = "comment";
      SemanticTokenTypes2["string"] = "string";
      SemanticTokenTypes2["number"] = "number";
      SemanticTokenTypes2["regexp"] = "regexp";
      SemanticTokenTypes2["operator"] = "operator";
      SemanticTokenTypes2["decorator"] = "decorator";
      SemanticTokenTypes2["label"] = "label";
    })(SemanticTokenTypes || (SemanticTokenTypes = {}));
    (function(SemanticTokenModifiers2) {
      SemanticTokenModifiers2["declaration"] = "declaration";
      SemanticTokenModifiers2["definition"] = "definition";
      SemanticTokenModifiers2["readonly"] = "readonly";
      SemanticTokenModifiers2["static"] = "static";
      SemanticTokenModifiers2["deprecated"] = "deprecated";
      SemanticTokenModifiers2["abstract"] = "abstract";
      SemanticTokenModifiers2["async"] = "async";
      SemanticTokenModifiers2["modification"] = "modification";
      SemanticTokenModifiers2["documentation"] = "documentation";
      SemanticTokenModifiers2["defaultLibrary"] = "defaultLibrary";
    })(SemanticTokenModifiers || (SemanticTokenModifiers = {}));
    (function(SemanticTokens2) {
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && (candidate.resultId === void 0 || typeof candidate.resultId === "string") && Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === "number");
      }
      SemanticTokens2.is = is;
    })(SemanticTokens || (SemanticTokens = {}));
    (function(InlineValueText2) {
      function create(range, text) {
        return { range, text };
      }
      InlineValueText2.create = create;
      function is(value) {
        const candidate = value;
        return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && Is.string(candidate.text);
      }
      InlineValueText2.is = is;
    })(InlineValueText || (InlineValueText = {}));
    (function(InlineValueVariableLookup2) {
      function create(range, variableName, caseSensitiveLookup) {
        return { range, variableName, caseSensitiveLookup };
      }
      InlineValueVariableLookup2.create = create;
      function is(value) {
        const candidate = value;
        return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && Is.boolean(candidate.caseSensitiveLookup) && (Is.string(candidate.variableName) || candidate.variableName === void 0);
      }
      InlineValueVariableLookup2.is = is;
    })(InlineValueVariableLookup || (InlineValueVariableLookup = {}));
    (function(InlineValueEvaluatableExpression2) {
      function create(range, expression) {
        return { range, expression };
      }
      InlineValueEvaluatableExpression2.create = create;
      function is(value) {
        const candidate = value;
        return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && (Is.string(candidate.expression) || candidate.expression === void 0);
      }
      InlineValueEvaluatableExpression2.is = is;
    })(InlineValueEvaluatableExpression || (InlineValueEvaluatableExpression = {}));
    (function(InlineValueContext2) {
      function create(frameId, stoppedLocation) {
        return { frameId, stoppedLocation };
      }
      InlineValueContext2.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Range.is(value.stoppedLocation);
      }
      InlineValueContext2.is = is;
    })(InlineValueContext || (InlineValueContext = {}));
    (function(InlayHintKind2) {
      InlayHintKind2.Type = 1;
      InlayHintKind2.Parameter = 2;
      function is(value) {
        return value === 1 || value === 2;
      }
      InlayHintKind2.is = is;
    })(InlayHintKind || (InlayHintKind = {}));
    (function(InlayHintLabelPart2) {
      function create(value) {
        return { value };
      }
      InlayHintLabelPart2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip) || MarkupContent.is(candidate.tooltip)) && (candidate.location === void 0 || Location.is(candidate.location)) && (candidate.command === void 0 || Command.is(candidate.command));
      }
      InlayHintLabelPart2.is = is;
    })(InlayHintLabelPart || (InlayHintLabelPart = {}));
    (function(InlayHint2) {
      function create(position, label, kind) {
        const result = { position, label };
        if (kind !== void 0) {
          result.kind = kind;
        }
        return result;
      }
      InlayHint2.create = create;
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && Position.is(candidate.position) && (Is.string(candidate.label) || Is.typedArray(candidate.label, InlayHintLabelPart.is)) && (candidate.kind === void 0 || InlayHintKind.is(candidate.kind)) && candidate.textEdits === void 0 || Is.typedArray(candidate.textEdits, TextEdit.is) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip) || MarkupContent.is(candidate.tooltip)) && (candidate.paddingLeft === void 0 || Is.boolean(candidate.paddingLeft)) && (candidate.paddingRight === void 0 || Is.boolean(candidate.paddingRight));
      }
      InlayHint2.is = is;
    })(InlayHint || (InlayHint = {}));
    (function(StringValue2) {
      function createSnippet(value) {
        return { kind: "snippet", value };
      }
      StringValue2.createSnippet = createSnippet;
      function isSnippet(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && candidate.kind === "snippet" && Is.string(candidate.value);
      }
      StringValue2.isSnippet = isSnippet;
    })(StringValue || (StringValue = {}));
    (function(InlineCompletionItem2) {
      function create(insertText, filterText, range, command) {
        return { insertText, filterText, range, command };
      }
      InlineCompletionItem2.create = create;
    })(InlineCompletionItem || (InlineCompletionItem = {}));
    (function(InlineCompletionList2) {
      function create(items) {
        return { items };
      }
      InlineCompletionList2.create = create;
    })(InlineCompletionList || (InlineCompletionList = {}));
    (function(InlineCompletionTriggerKind2) {
      InlineCompletionTriggerKind2.Invoked = 1;
      InlineCompletionTriggerKind2.Automatic = 2;
    })(InlineCompletionTriggerKind || (InlineCompletionTriggerKind = {}));
    (function(SelectedCompletionInfo2) {
      function create(range, text) {
        return { range, text };
      }
      SelectedCompletionInfo2.create = create;
    })(SelectedCompletionInfo || (SelectedCompletionInfo = {}));
    (function(InlineCompletionContext2) {
      function create(triggerKind, selectedCompletionInfo) {
        return { triggerKind, selectedCompletionInfo };
      }
      InlineCompletionContext2.create = create;
    })(InlineCompletionContext || (InlineCompletionContext = {}));
    (function(WorkspaceFolder2) {
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && URI.is(candidate.uri) && Is.string(candidate.name);
      }
      WorkspaceFolder2.is = is;
    })(WorkspaceFolder || (WorkspaceFolder = {}));
    EOL = ["\n", "\r\n", "\r"];
    (function(TextDocument3) {
      function create(uri, languageId, version, content) {
        return new FullTextDocument2(uri, languageId, version, content);
      }
      TextDocument3.create = create;
      function is(value) {
        const candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.uinteger(candidate.lineCount) && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
      }
      TextDocument3.is = is;
      function applyEdits(document, edits) {
        let text = document.getText();
        const sortedEdits = mergeSort2(edits, (a2, b2) => {
          const diff = a2.range.start.line - b2.range.start.line;
          if (diff === 0) {
            return a2.range.start.character - b2.range.start.character;
          }
          return diff;
        });
        let lastModifiedOffset = text.length;
        for (let i2 = sortedEdits.length - 1; i2 >= 0; i2--) {
          const e2 = sortedEdits[i2];
          const startOffset = document.offsetAt(e2.range.start);
          const endOffset = document.offsetAt(e2.range.end);
          if (endOffset <= lastModifiedOffset) {
            text = text.substring(0, startOffset) + e2.newText + text.substring(endOffset, text.length);
          } else {
            throw new Error("Overlapping edit");
          }
          lastModifiedOffset = startOffset;
        }
        return text;
      }
      TextDocument3.applyEdits = applyEdits;
      function mergeSort2(data, compare) {
        if (data.length <= 1) {
          return data;
        }
        const p2 = data.length / 2 | 0;
        const left = data.slice(0, p2);
        const right = data.slice(p2);
        mergeSort2(left, compare);
        mergeSort2(right, compare);
        let leftIdx = 0;
        let rightIdx = 0;
        let i2 = 0;
        while (leftIdx < left.length && rightIdx < right.length) {
          const ret = compare(left[leftIdx], right[rightIdx]);
          if (ret <= 0) {
            data[i2++] = left[leftIdx++];
          } else {
            data[i2++] = right[rightIdx++];
          }
        }
        while (leftIdx < left.length) {
          data[i2++] = left[leftIdx++];
        }
        while (rightIdx < right.length) {
          data[i2++] = right[rightIdx++];
        }
        return data;
      }
    })(TextDocument2 || (TextDocument2 = {}));
    FullTextDocument2 = class {
      constructor(uri, languageId, version, content) {
        this._uri = uri;
        this._languageId = languageId;
        this._version = version;
        this._content = content;
        this._lineOffsets = void 0;
      }
      get uri() {
        return this._uri;
      }
      get languageId() {
        return this._languageId;
      }
      get version() {
        return this._version;
      }
      getText(range) {
        if (range) {
          const start = this.offsetAt(range.start);
          const end = this.offsetAt(range.end);
          return this._content.substring(start, end);
        }
        return this._content;
      }
      update(event, version) {
        this._content = event.text;
        this._version = version;
        this._lineOffsets = void 0;
      }
      getLineOffsets() {
        if (this._lineOffsets === void 0) {
          const lineOffsets = [];
          const text = this._content;
          let isLineStart = true;
          for (let i2 = 0; i2 < text.length; i2++) {
            if (isLineStart) {
              lineOffsets.push(i2);
              isLineStart = false;
            }
            const ch = text.charAt(i2);
            isLineStart = ch === "\r" || ch === "\n";
            if (ch === "\r" && i2 + 1 < text.length && text.charAt(i2 + 1) === "\n") {
              i2++;
            }
          }
          if (isLineStart && text.length > 0) {
            lineOffsets.push(text.length);
          }
          this._lineOffsets = lineOffsets;
        }
        return this._lineOffsets;
      }
      positionAt(offset) {
        offset = Math.max(Math.min(offset, this._content.length), 0);
        const lineOffsets = this.getLineOffsets();
        let low = 0, high = lineOffsets.length;
        if (high === 0) {
          return Position.create(0, offset);
        }
        while (low < high) {
          const mid = Math.floor((low + high) / 2);
          if (lineOffsets[mid] > offset) {
            high = mid;
          } else {
            low = mid + 1;
          }
        }
        const line2 = low - 1;
        return Position.create(line2, offset - lineOffsets[line2]);
      }
      offsetAt(position) {
        const lineOffsets = this.getLineOffsets();
        if (position.line >= lineOffsets.length) {
          return this._content.length;
        } else if (position.line < 0) {
          return 0;
        }
        const lineOffset = lineOffsets[position.line];
        const nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
        return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
      }
      get lineCount() {
        return this.getLineOffsets().length;
      }
    };
    (function(Is2) {
      const toString = Object.prototype.toString;
      function defined(value) {
        return typeof value !== "undefined";
      }
      Is2.defined = defined;
      function undefined2(value) {
        return typeof value === "undefined";
      }
      Is2.undefined = undefined2;
      function boolean(value) {
        return value === true || value === false;
      }
      Is2.boolean = boolean;
      function string(value) {
        return toString.call(value) === "[object String]";
      }
      Is2.string = string;
      function number(value) {
        return toString.call(value) === "[object Number]";
      }
      Is2.number = number;
      function numberRange(value, min, max) {
        return toString.call(value) === "[object Number]" && min <= value && value <= max;
      }
      Is2.numberRange = numberRange;
      function integer2(value) {
        return toString.call(value) === "[object Number]" && -2147483648 <= value && value <= 2147483647;
      }
      Is2.integer = integer2;
      function uinteger2(value) {
        return toString.call(value) === "[object Number]" && 0 <= value && value <= 2147483647;
      }
      Is2.uinteger = uinteger2;
      function func(value) {
        return toString.call(value) === "[object Function]";
      }
      Is2.func = func;
      function objectLiteral(value) {
        return value !== null && typeof value === "object";
      }
      Is2.objectLiteral = objectLiteral;
      function typedArray(value, check) {
        return Array.isArray(value) && value.every(check);
      }
      Is2.typedArray = typedArray;
    })(Is || (Is = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/messages.js
var require_messages2 = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/messages.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CM = exports2.ProtocolNotificationType = exports2.ProtocolNotificationType0 = exports2.ProtocolRequestType = exports2.ProtocolRequestType0 = exports2.RegistrationType = exports2.MessageDirection = void 0;
    var vscode_jsonrpc_1 = require_api();
    var MessageDirection;
    (function(MessageDirection2) {
      MessageDirection2["clientToServer"] = "clientToServer";
      MessageDirection2["serverToClient"] = "serverToClient";
      MessageDirection2["both"] = "both";
    })(MessageDirection || (exports2.MessageDirection = MessageDirection = {}));
    var RegistrationType = class {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      ____;
      method;
      constructor(method) {
        this.method = method;
      }
    };
    exports2.RegistrationType = RegistrationType;
    var ProtocolRequestType0 = class extends vscode_jsonrpc_1.RequestType0 {
      /**
       * Clients must not use these properties. They are here to ensure correct typing.
       * in TypeScript
       */
      __;
      ___;
      ____;
      _pr;
      constructor(method) {
        super(method);
      }
    };
    exports2.ProtocolRequestType0 = ProtocolRequestType0;
    var ProtocolRequestType = class extends vscode_jsonrpc_1.RequestType {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      __;
      ___;
      ____;
      _pr;
      constructor(method) {
        super(method, vscode_jsonrpc_1.ParameterStructures.byName);
      }
    };
    exports2.ProtocolRequestType = ProtocolRequestType;
    var ProtocolNotificationType0 = class extends vscode_jsonrpc_1.NotificationType0 {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      ___;
      ____;
      constructor(method) {
        super(method);
      }
    };
    exports2.ProtocolNotificationType0 = ProtocolNotificationType0;
    var ProtocolNotificationType = class extends vscode_jsonrpc_1.NotificationType {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      ___;
      ____;
      constructor(method) {
        super(method, vscode_jsonrpc_1.ParameterStructures.byName);
      }
    };
    exports2.ProtocolNotificationType = ProtocolNotificationType;
    var CM;
    (function(CM2) {
      function create(client, server) {
        return { client, server };
      }
      CM2.create = create;
    })(CM || (exports2.CM = CM = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/utils/is.js
var require_is3 = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/utils/is.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.boolean = boolean;
    exports2.string = string;
    exports2.number = number;
    exports2.error = error;
    exports2.func = func;
    exports2.array = array;
    exports2.stringArray = stringArray;
    exports2.typedArray = typedArray;
    exports2.objectLiteral = objectLiteral;
    function boolean(value) {
      return value === true || value === false;
    }
    function string(value) {
      return typeof value === "string" || value instanceof String;
    }
    function number(value) {
      return typeof value === "number" || value instanceof Number;
    }
    function error(value) {
      return value instanceof Error;
    }
    function func(value) {
      return typeof value === "function";
    }
    function array(value) {
      return Array.isArray(value);
    }
    function stringArray(value) {
      return array(value) && value.every((elem) => string(elem));
    }
    function typedArray(value, check) {
      return Array.isArray(value) && value.every(check);
    }
    function objectLiteral(value) {
      return value !== null && typeof value === "object";
    }
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.implementation.js
var require_protocol_implementation = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.implementation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ImplementationRequest = void 0;
    var messages_1 = require_messages2();
    var ImplementationRequest;
    (function(ImplementationRequest2) {
      ImplementationRequest2.method = "textDocument/implementation";
      ImplementationRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      ImplementationRequest2.type = new messages_1.ProtocolRequestType(ImplementationRequest2.method);
      ImplementationRequest2.capabilities = messages_1.CM.create("textDocument.implementation", "implementationProvider");
    })(ImplementationRequest || (exports2.ImplementationRequest = ImplementationRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.typeDefinition.js
var require_protocol_typeDefinition = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.typeDefinition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TypeDefinitionRequest = void 0;
    var messages_1 = require_messages2();
    var TypeDefinitionRequest;
    (function(TypeDefinitionRequest2) {
      TypeDefinitionRequest2.method = "textDocument/typeDefinition";
      TypeDefinitionRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      TypeDefinitionRequest2.type = new messages_1.ProtocolRequestType(TypeDefinitionRequest2.method);
      TypeDefinitionRequest2.capabilities = messages_1.CM.create("textDocument.typeDefinition", "typeDefinitionProvider");
    })(TypeDefinitionRequest || (exports2.TypeDefinitionRequest = TypeDefinitionRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.workspaceFolder.js
var require_protocol_workspaceFolder = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.workspaceFolder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DidChangeWorkspaceFoldersNotification = exports2.WorkspaceFoldersRequest = void 0;
    var messages_1 = require_messages2();
    var WorkspaceFoldersRequest;
    (function(WorkspaceFoldersRequest2) {
      WorkspaceFoldersRequest2.method = "workspace/workspaceFolders";
      WorkspaceFoldersRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      WorkspaceFoldersRequest2.type = new messages_1.ProtocolRequestType0(WorkspaceFoldersRequest2.method);
      WorkspaceFoldersRequest2.capabilities = messages_1.CM.create("workspace.workspaceFolders", "workspace.workspaceFolders");
    })(WorkspaceFoldersRequest || (exports2.WorkspaceFoldersRequest = WorkspaceFoldersRequest = {}));
    var DidChangeWorkspaceFoldersNotification;
    (function(DidChangeWorkspaceFoldersNotification2) {
      DidChangeWorkspaceFoldersNotification2.method = "workspace/didChangeWorkspaceFolders";
      DidChangeWorkspaceFoldersNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidChangeWorkspaceFoldersNotification2.type = new messages_1.ProtocolNotificationType(DidChangeWorkspaceFoldersNotification2.method);
      DidChangeWorkspaceFoldersNotification2.capabilities = messages_1.CM.create(void 0, "workspace.workspaceFolders.changeNotifications");
    })(DidChangeWorkspaceFoldersNotification || (exports2.DidChangeWorkspaceFoldersNotification = DidChangeWorkspaceFoldersNotification = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.configuration.js
var require_protocol_configuration = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.configuration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ConfigurationRequest = void 0;
    var messages_1 = require_messages2();
    var ConfigurationRequest;
    (function(ConfigurationRequest2) {
      ConfigurationRequest2.method = "workspace/configuration";
      ConfigurationRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      ConfigurationRequest2.type = new messages_1.ProtocolRequestType(ConfigurationRequest2.method);
      ConfigurationRequest2.capabilities = messages_1.CM.create("workspace.configuration", void 0);
    })(ConfigurationRequest || (exports2.ConfigurationRequest = ConfigurationRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.colorProvider.js
var require_protocol_colorProvider = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.colorProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ColorPresentationRequest = exports2.DocumentColorRequest = void 0;
    var messages_1 = require_messages2();
    var DocumentColorRequest;
    (function(DocumentColorRequest2) {
      DocumentColorRequest2.method = "textDocument/documentColor";
      DocumentColorRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentColorRequest2.type = new messages_1.ProtocolRequestType(DocumentColorRequest2.method);
      DocumentColorRequest2.capabilities = messages_1.CM.create("textDocument.colorProvider", "colorProvider");
    })(DocumentColorRequest || (exports2.DocumentColorRequest = DocumentColorRequest = {}));
    var ColorPresentationRequest;
    (function(ColorPresentationRequest2) {
      ColorPresentationRequest2.method = "textDocument/colorPresentation";
      ColorPresentationRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      ColorPresentationRequest2.type = new messages_1.ProtocolRequestType(ColorPresentationRequest2.method);
      ColorPresentationRequest2.capabilities = messages_1.CM.create("textDocument.colorProvider", "colorProvider");
    })(ColorPresentationRequest || (exports2.ColorPresentationRequest = ColorPresentationRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.foldingRange.js
var require_protocol_foldingRange = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.foldingRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FoldingRangeRefreshRequest = exports2.FoldingRangeRequest = void 0;
    var messages_1 = require_messages2();
    var FoldingRangeRequest;
    (function(FoldingRangeRequest2) {
      FoldingRangeRequest2.method = "textDocument/foldingRange";
      FoldingRangeRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      FoldingRangeRequest2.type = new messages_1.ProtocolRequestType(FoldingRangeRequest2.method);
      FoldingRangeRequest2.capabilities = messages_1.CM.create("textDocument.foldingRange", "foldingRangeProvider");
    })(FoldingRangeRequest || (exports2.FoldingRangeRequest = FoldingRangeRequest = {}));
    var FoldingRangeRefreshRequest;
    (function(FoldingRangeRefreshRequest2) {
      FoldingRangeRefreshRequest2.method = `workspace/foldingRange/refresh`;
      FoldingRangeRefreshRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      FoldingRangeRefreshRequest2.type = new messages_1.ProtocolRequestType0(FoldingRangeRefreshRequest2.method);
      FoldingRangeRefreshRequest2.capabilities = messages_1.CM.create("workspace.foldingRange.refreshSupport", void 0);
    })(FoldingRangeRefreshRequest || (exports2.FoldingRangeRefreshRequest = FoldingRangeRefreshRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.declaration.js
var require_protocol_declaration = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.declaration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DeclarationRequest = void 0;
    var messages_1 = require_messages2();
    var DeclarationRequest;
    (function(DeclarationRequest2) {
      DeclarationRequest2.method = "textDocument/declaration";
      DeclarationRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DeclarationRequest2.type = new messages_1.ProtocolRequestType(DeclarationRequest2.method);
      DeclarationRequest2.capabilities = messages_1.CM.create("textDocument.declaration", "declarationProvider");
    })(DeclarationRequest || (exports2.DeclarationRequest = DeclarationRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.selectionRange.js
var require_protocol_selectionRange = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.selectionRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SelectionRangeRequest = void 0;
    var messages_1 = require_messages2();
    var SelectionRangeRequest;
    (function(SelectionRangeRequest2) {
      SelectionRangeRequest2.method = "textDocument/selectionRange";
      SelectionRangeRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      SelectionRangeRequest2.type = new messages_1.ProtocolRequestType(SelectionRangeRequest2.method);
      SelectionRangeRequest2.capabilities = messages_1.CM.create("textDocument.selectionRange", "selectionRangeProvider");
    })(SelectionRangeRequest || (exports2.SelectionRangeRequest = SelectionRangeRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.progress.js
var require_protocol_progress = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.progress.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCreateRequest = exports2.WorkDoneProgress = void 0;
    var vscode_jsonrpc_1 = require_api();
    var messages_1 = require_messages2();
    var WorkDoneProgress;
    (function(WorkDoneProgress2) {
      WorkDoneProgress2.type = new vscode_jsonrpc_1.ProgressType();
      function is(value) {
        return value === WorkDoneProgress2.type;
      }
      WorkDoneProgress2.is = is;
    })(WorkDoneProgress || (exports2.WorkDoneProgress = WorkDoneProgress = {}));
    var WorkDoneProgressCreateRequest;
    (function(WorkDoneProgressCreateRequest2) {
      WorkDoneProgressCreateRequest2.method = "window/workDoneProgress/create";
      WorkDoneProgressCreateRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      WorkDoneProgressCreateRequest2.type = new messages_1.ProtocolRequestType(WorkDoneProgressCreateRequest2.method);
      WorkDoneProgressCreateRequest2.capabilities = messages_1.CM.create("window.workDoneProgress", void 0);
    })(WorkDoneProgressCreateRequest || (exports2.WorkDoneProgressCreateRequest = WorkDoneProgressCreateRequest = {}));
    var WorkDoneProgressCancelNotification;
    (function(WorkDoneProgressCancelNotification2) {
      WorkDoneProgressCancelNotification2.method = "window/workDoneProgress/cancel";
      WorkDoneProgressCancelNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      WorkDoneProgressCancelNotification2.type = new messages_1.ProtocolNotificationType(WorkDoneProgressCancelNotification2.method);
    })(WorkDoneProgressCancelNotification || (exports2.WorkDoneProgressCancelNotification = WorkDoneProgressCancelNotification = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.callHierarchy.js
var require_protocol_callHierarchy = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.callHierarchy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyIncomingCallsRequest = exports2.CallHierarchyPrepareRequest = void 0;
    var messages_1 = require_messages2();
    var CallHierarchyPrepareRequest;
    (function(CallHierarchyPrepareRequest2) {
      CallHierarchyPrepareRequest2.method = "textDocument/prepareCallHierarchy";
      CallHierarchyPrepareRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CallHierarchyPrepareRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyPrepareRequest2.method);
      CallHierarchyPrepareRequest2.capabilities = messages_1.CM.create("textDocument.callHierarchy", "callHierarchyProvider");
    })(CallHierarchyPrepareRequest || (exports2.CallHierarchyPrepareRequest = CallHierarchyPrepareRequest = {}));
    var CallHierarchyIncomingCallsRequest;
    (function(CallHierarchyIncomingCallsRequest2) {
      CallHierarchyIncomingCallsRequest2.method = "callHierarchy/incomingCalls";
      CallHierarchyIncomingCallsRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CallHierarchyIncomingCallsRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyIncomingCallsRequest2.method);
      CallHierarchyIncomingCallsRequest2.capabilities = messages_1.CM.create("textDocument.callHierarchy", "callHierarchyProvider");
    })(CallHierarchyIncomingCallsRequest || (exports2.CallHierarchyIncomingCallsRequest = CallHierarchyIncomingCallsRequest = {}));
    var CallHierarchyOutgoingCallsRequest;
    (function(CallHierarchyOutgoingCallsRequest2) {
      CallHierarchyOutgoingCallsRequest2.method = "callHierarchy/outgoingCalls";
      CallHierarchyOutgoingCallsRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CallHierarchyOutgoingCallsRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyOutgoingCallsRequest2.method);
      CallHierarchyOutgoingCallsRequest2.capabilities = messages_1.CM.create("textDocument.callHierarchy", "callHierarchyProvider");
    })(CallHierarchyOutgoingCallsRequest || (exports2.CallHierarchyOutgoingCallsRequest = CallHierarchyOutgoingCallsRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.semanticTokens.js
var require_protocol_semanticTokens = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.semanticTokens.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SemanticTokensRefreshRequest = exports2.SemanticTokensRangeRequest = exports2.SemanticTokensDeltaRequest = exports2.SemanticTokensRequest = exports2.SemanticTokensRegistrationType = exports2.TokenFormat = void 0;
    var messages_1 = require_messages2();
    var TokenFormat;
    (function(TokenFormat2) {
      TokenFormat2.Relative = "relative";
    })(TokenFormat || (exports2.TokenFormat = TokenFormat = {}));
    var SemanticTokensRegistrationType;
    (function(SemanticTokensRegistrationType2) {
      SemanticTokensRegistrationType2.method = "textDocument/semanticTokens";
      SemanticTokensRegistrationType2.type = new messages_1.RegistrationType(SemanticTokensRegistrationType2.method);
    })(SemanticTokensRegistrationType || (exports2.SemanticTokensRegistrationType = SemanticTokensRegistrationType = {}));
    var SemanticTokensRequest;
    (function(SemanticTokensRequest2) {
      SemanticTokensRequest2.method = "textDocument/semanticTokens/full";
      SemanticTokensRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      SemanticTokensRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensRequest2.method);
      SemanticTokensRequest2.registrationMethod = SemanticTokensRegistrationType.method;
      SemanticTokensRequest2.capabilities = messages_1.CM.create("textDocument.semanticTokens", "semanticTokensProvider");
    })(SemanticTokensRequest || (exports2.SemanticTokensRequest = SemanticTokensRequest = {}));
    var SemanticTokensDeltaRequest;
    (function(SemanticTokensDeltaRequest2) {
      SemanticTokensDeltaRequest2.method = "textDocument/semanticTokens/full/delta";
      SemanticTokensDeltaRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      SemanticTokensDeltaRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensDeltaRequest2.method);
      SemanticTokensDeltaRequest2.registrationMethod = SemanticTokensRegistrationType.method;
      SemanticTokensDeltaRequest2.capabilities = messages_1.CM.create("textDocument.semanticTokens.requests.full.delta", "semanticTokensProvider.full.delta");
    })(SemanticTokensDeltaRequest || (exports2.SemanticTokensDeltaRequest = SemanticTokensDeltaRequest = {}));
    var SemanticTokensRangeRequest;
    (function(SemanticTokensRangeRequest2) {
      SemanticTokensRangeRequest2.method = "textDocument/semanticTokens/range";
      SemanticTokensRangeRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      SemanticTokensRangeRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensRangeRequest2.method);
      SemanticTokensRangeRequest2.registrationMethod = SemanticTokensRegistrationType.method;
      SemanticTokensRangeRequest2.capabilities = messages_1.CM.create("textDocument.semanticTokens.requests.range", "semanticTokensProvider.range");
    })(SemanticTokensRangeRequest || (exports2.SemanticTokensRangeRequest = SemanticTokensRangeRequest = {}));
    var SemanticTokensRefreshRequest;
    (function(SemanticTokensRefreshRequest2) {
      SemanticTokensRefreshRequest2.method = `workspace/semanticTokens/refresh`;
      SemanticTokensRefreshRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      SemanticTokensRefreshRequest2.type = new messages_1.ProtocolRequestType0(SemanticTokensRefreshRequest2.method);
      SemanticTokensRefreshRequest2.capabilities = messages_1.CM.create("workspace.semanticTokens.refreshSupport", void 0);
    })(SemanticTokensRefreshRequest || (exports2.SemanticTokensRefreshRequest = SemanticTokensRefreshRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.showDocument.js
var require_protocol_showDocument = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.showDocument.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ShowDocumentRequest = void 0;
    var messages_1 = require_messages2();
    var ShowDocumentRequest;
    (function(ShowDocumentRequest2) {
      ShowDocumentRequest2.method = "window/showDocument";
      ShowDocumentRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      ShowDocumentRequest2.type = new messages_1.ProtocolRequestType(ShowDocumentRequest2.method);
      ShowDocumentRequest2.capabilities = messages_1.CM.create("window.showDocument.support", void 0);
    })(ShowDocumentRequest || (exports2.ShowDocumentRequest = ShowDocumentRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.linkedEditingRange.js
var require_protocol_linkedEditingRange = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.linkedEditingRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LinkedEditingRangeRequest = void 0;
    var messages_1 = require_messages2();
    var LinkedEditingRangeRequest;
    (function(LinkedEditingRangeRequest2) {
      LinkedEditingRangeRequest2.method = "textDocument/linkedEditingRange";
      LinkedEditingRangeRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      LinkedEditingRangeRequest2.type = new messages_1.ProtocolRequestType(LinkedEditingRangeRequest2.method);
      LinkedEditingRangeRequest2.capabilities = messages_1.CM.create("textDocument.linkedEditingRange", "linkedEditingRangeProvider");
    })(LinkedEditingRangeRequest || (exports2.LinkedEditingRangeRequest = LinkedEditingRangeRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.fileOperations.js
var require_protocol_fileOperations = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.fileOperations.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WillDeleteFilesRequest = exports2.DidDeleteFilesNotification = exports2.DidRenameFilesNotification = exports2.WillRenameFilesRequest = exports2.DidCreateFilesNotification = exports2.WillCreateFilesRequest = exports2.FileOperationPatternKind = void 0;
    var messages_1 = require_messages2();
    var FileOperationPatternKind;
    (function(FileOperationPatternKind2) {
      FileOperationPatternKind2.file = "file";
      FileOperationPatternKind2.folder = "folder";
    })(FileOperationPatternKind || (exports2.FileOperationPatternKind = FileOperationPatternKind = {}));
    var WillCreateFilesRequest;
    (function(WillCreateFilesRequest2) {
      WillCreateFilesRequest2.method = "workspace/willCreateFiles";
      WillCreateFilesRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      WillCreateFilesRequest2.type = new messages_1.ProtocolRequestType(WillCreateFilesRequest2.method);
      WillCreateFilesRequest2.capabilities = messages_1.CM.create("workspace.fileOperations.willCreate", "workspace.fileOperations.willCreate");
    })(WillCreateFilesRequest || (exports2.WillCreateFilesRequest = WillCreateFilesRequest = {}));
    var DidCreateFilesNotification;
    (function(DidCreateFilesNotification2) {
      DidCreateFilesNotification2.method = "workspace/didCreateFiles";
      DidCreateFilesNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidCreateFilesNotification2.type = new messages_1.ProtocolNotificationType(DidCreateFilesNotification2.method);
      DidCreateFilesNotification2.capabilities = messages_1.CM.create("workspace.fileOperations.didCreate", "workspace.fileOperations.didCreate");
    })(DidCreateFilesNotification || (exports2.DidCreateFilesNotification = DidCreateFilesNotification = {}));
    var WillRenameFilesRequest;
    (function(WillRenameFilesRequest2) {
      WillRenameFilesRequest2.method = "workspace/willRenameFiles";
      WillRenameFilesRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      WillRenameFilesRequest2.type = new messages_1.ProtocolRequestType(WillRenameFilesRequest2.method);
      WillRenameFilesRequest2.capabilities = messages_1.CM.create("workspace.fileOperations.willRename", "workspace.fileOperations.willRename");
    })(WillRenameFilesRequest || (exports2.WillRenameFilesRequest = WillRenameFilesRequest = {}));
    var DidRenameFilesNotification;
    (function(DidRenameFilesNotification2) {
      DidRenameFilesNotification2.method = "workspace/didRenameFiles";
      DidRenameFilesNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidRenameFilesNotification2.type = new messages_1.ProtocolNotificationType(DidRenameFilesNotification2.method);
      DidRenameFilesNotification2.capabilities = messages_1.CM.create("workspace.fileOperations.didRename", "workspace.fileOperations.didRename");
    })(DidRenameFilesNotification || (exports2.DidRenameFilesNotification = DidRenameFilesNotification = {}));
    var DidDeleteFilesNotification;
    (function(DidDeleteFilesNotification2) {
      DidDeleteFilesNotification2.method = "workspace/didDeleteFiles";
      DidDeleteFilesNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidDeleteFilesNotification2.type = new messages_1.ProtocolNotificationType(DidDeleteFilesNotification2.method);
      DidDeleteFilesNotification2.capabilities = messages_1.CM.create("workspace.fileOperations.didDelete", "workspace.fileOperations.didDelete");
    })(DidDeleteFilesNotification || (exports2.DidDeleteFilesNotification = DidDeleteFilesNotification = {}));
    var WillDeleteFilesRequest;
    (function(WillDeleteFilesRequest2) {
      WillDeleteFilesRequest2.method = "workspace/willDeleteFiles";
      WillDeleteFilesRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      WillDeleteFilesRequest2.type = new messages_1.ProtocolRequestType(WillDeleteFilesRequest2.method);
      WillDeleteFilesRequest2.capabilities = messages_1.CM.create("workspace.fileOperations.willDelete", "workspace.fileOperations.willDelete");
    })(WillDeleteFilesRequest || (exports2.WillDeleteFilesRequest = WillDeleteFilesRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.moniker.js
var require_protocol_moniker = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.moniker.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MonikerRequest = exports2.MonikerKind = exports2.UniquenessLevel = void 0;
    var messages_1 = require_messages2();
    var UniquenessLevel;
    (function(UniquenessLevel2) {
      UniquenessLevel2.document = "document";
      UniquenessLevel2.project = "project";
      UniquenessLevel2.group = "group";
      UniquenessLevel2.scheme = "scheme";
      UniquenessLevel2.global = "global";
    })(UniquenessLevel || (exports2.UniquenessLevel = UniquenessLevel = {}));
    var MonikerKind;
    (function(MonikerKind2) {
      MonikerKind2.$import = "import";
      MonikerKind2.$export = "export";
      MonikerKind2.local = "local";
    })(MonikerKind || (exports2.MonikerKind = MonikerKind = {}));
    var MonikerRequest;
    (function(MonikerRequest2) {
      MonikerRequest2.method = "textDocument/moniker";
      MonikerRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      MonikerRequest2.type = new messages_1.ProtocolRequestType(MonikerRequest2.method);
      MonikerRequest2.capabilities = messages_1.CM.create("textDocument.moniker", "monikerProvider");
    })(MonikerRequest || (exports2.MonikerRequest = MonikerRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.typeHierarchy.js
var require_protocol_typeHierarchy = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.typeHierarchy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TypeHierarchySubtypesRequest = exports2.TypeHierarchySupertypesRequest = exports2.TypeHierarchyPrepareRequest = void 0;
    var messages_1 = require_messages2();
    var TypeHierarchyPrepareRequest;
    (function(TypeHierarchyPrepareRequest2) {
      TypeHierarchyPrepareRequest2.method = "textDocument/prepareTypeHierarchy";
      TypeHierarchyPrepareRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      TypeHierarchyPrepareRequest2.type = new messages_1.ProtocolRequestType(TypeHierarchyPrepareRequest2.method);
      TypeHierarchyPrepareRequest2.capabilities = messages_1.CM.create("textDocument.typeHierarchy", "typeHierarchyProvider");
    })(TypeHierarchyPrepareRequest || (exports2.TypeHierarchyPrepareRequest = TypeHierarchyPrepareRequest = {}));
    var TypeHierarchySupertypesRequest;
    (function(TypeHierarchySupertypesRequest2) {
      TypeHierarchySupertypesRequest2.method = "typeHierarchy/supertypes";
      TypeHierarchySupertypesRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      TypeHierarchySupertypesRequest2.type = new messages_1.ProtocolRequestType(TypeHierarchySupertypesRequest2.method);
    })(TypeHierarchySupertypesRequest || (exports2.TypeHierarchySupertypesRequest = TypeHierarchySupertypesRequest = {}));
    var TypeHierarchySubtypesRequest;
    (function(TypeHierarchySubtypesRequest2) {
      TypeHierarchySubtypesRequest2.method = "typeHierarchy/subtypes";
      TypeHierarchySubtypesRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      TypeHierarchySubtypesRequest2.type = new messages_1.ProtocolRequestType(TypeHierarchySubtypesRequest2.method);
    })(TypeHierarchySubtypesRequest || (exports2.TypeHierarchySubtypesRequest = TypeHierarchySubtypesRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlineValue.js
var require_protocol_inlineValue = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlineValue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InlineValueRefreshRequest = exports2.InlineValueRequest = void 0;
    var messages_1 = require_messages2();
    var InlineValueRequest;
    (function(InlineValueRequest2) {
      InlineValueRequest2.method = "textDocument/inlineValue";
      InlineValueRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      InlineValueRequest2.type = new messages_1.ProtocolRequestType(InlineValueRequest2.method);
      InlineValueRequest2.capabilities = messages_1.CM.create("textDocument.inlineValue", "inlineValueProvider");
    })(InlineValueRequest || (exports2.InlineValueRequest = InlineValueRequest = {}));
    var InlineValueRefreshRequest;
    (function(InlineValueRefreshRequest2) {
      InlineValueRefreshRequest2.method = `workspace/inlineValue/refresh`;
      InlineValueRefreshRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      InlineValueRefreshRequest2.type = new messages_1.ProtocolRequestType0(InlineValueRefreshRequest2.method);
      InlineValueRefreshRequest2.capabilities = messages_1.CM.create("workspace.inlineValue.refreshSupport", void 0);
    })(InlineValueRefreshRequest || (exports2.InlineValueRefreshRequest = InlineValueRefreshRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlayHint.js
var require_protocol_inlayHint = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlayHint.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InlayHintRefreshRequest = exports2.InlayHintResolveRequest = exports2.InlayHintRequest = void 0;
    var messages_1 = require_messages2();
    var InlayHintRequest;
    (function(InlayHintRequest2) {
      InlayHintRequest2.method = "textDocument/inlayHint";
      InlayHintRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      InlayHintRequest2.type = new messages_1.ProtocolRequestType(InlayHintRequest2.method);
      InlayHintRequest2.capabilities = messages_1.CM.create("textDocument.inlayHint", "inlayHintProvider");
    })(InlayHintRequest || (exports2.InlayHintRequest = InlayHintRequest = {}));
    var InlayHintResolveRequest;
    (function(InlayHintResolveRequest2) {
      InlayHintResolveRequest2.method = "inlayHint/resolve";
      InlayHintResolveRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      InlayHintResolveRequest2.type = new messages_1.ProtocolRequestType(InlayHintResolveRequest2.method);
      InlayHintResolveRequest2.capabilities = messages_1.CM.create("textDocument.inlayHint.resolveSupport", "inlayHintProvider.resolveProvider");
    })(InlayHintResolveRequest || (exports2.InlayHintResolveRequest = InlayHintResolveRequest = {}));
    var InlayHintRefreshRequest;
    (function(InlayHintRefreshRequest2) {
      InlayHintRefreshRequest2.method = `workspace/inlayHint/refresh`;
      InlayHintRefreshRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      InlayHintRefreshRequest2.type = new messages_1.ProtocolRequestType0(InlayHintRefreshRequest2.method);
      InlayHintRefreshRequest2.capabilities = messages_1.CM.create("workspace.inlayHint.refreshSupport", void 0);
    })(InlayHintRefreshRequest || (exports2.InlayHintRefreshRequest = InlayHintRefreshRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.diagnostic.js
var require_protocol_diagnostic = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.diagnostic.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DiagnosticRefreshRequest = exports2.WorkspaceDiagnosticRequest = exports2.DocumentDiagnosticRequest = exports2.DocumentDiagnosticReportKind = exports2.DiagnosticServerCancellationData = void 0;
    var vscode_jsonrpc_1 = require_api();
    var Is2 = __importStar(require_is3());
    var messages_1 = require_messages2();
    var DiagnosticServerCancellationData;
    (function(DiagnosticServerCancellationData2) {
      function is(value) {
        const candidate = value;
        return candidate && Is2.boolean(candidate.retriggerRequest);
      }
      DiagnosticServerCancellationData2.is = is;
    })(DiagnosticServerCancellationData || (exports2.DiagnosticServerCancellationData = DiagnosticServerCancellationData = {}));
    var DocumentDiagnosticReportKind;
    (function(DocumentDiagnosticReportKind2) {
      DocumentDiagnosticReportKind2.Full = "full";
      DocumentDiagnosticReportKind2.Unchanged = "unchanged";
    })(DocumentDiagnosticReportKind || (exports2.DocumentDiagnosticReportKind = DocumentDiagnosticReportKind = {}));
    var DocumentDiagnosticRequest;
    (function(DocumentDiagnosticRequest2) {
      DocumentDiagnosticRequest2.method = "textDocument/diagnostic";
      DocumentDiagnosticRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentDiagnosticRequest2.type = new messages_1.ProtocolRequestType(DocumentDiagnosticRequest2.method);
      DocumentDiagnosticRequest2.partialResult = new vscode_jsonrpc_1.ProgressType();
      DocumentDiagnosticRequest2.capabilities = messages_1.CM.create("textDocument.diagnostic", "diagnosticProvider");
    })(DocumentDiagnosticRequest || (exports2.DocumentDiagnosticRequest = DocumentDiagnosticRequest = {}));
    var WorkspaceDiagnosticRequest;
    (function(WorkspaceDiagnosticRequest2) {
      WorkspaceDiagnosticRequest2.method = "workspace/diagnostic";
      WorkspaceDiagnosticRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      WorkspaceDiagnosticRequest2.type = new messages_1.ProtocolRequestType(WorkspaceDiagnosticRequest2.method);
      WorkspaceDiagnosticRequest2.partialResult = new vscode_jsonrpc_1.ProgressType();
      WorkspaceDiagnosticRequest2.capabilities = messages_1.CM.create("workspace.diagnostics", "diagnosticProvider.workspaceDiagnostics");
    })(WorkspaceDiagnosticRequest || (exports2.WorkspaceDiagnosticRequest = WorkspaceDiagnosticRequest = {}));
    var DiagnosticRefreshRequest;
    (function(DiagnosticRefreshRequest2) {
      DiagnosticRefreshRequest2.method = `workspace/diagnostic/refresh`;
      DiagnosticRefreshRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      DiagnosticRefreshRequest2.type = new messages_1.ProtocolRequestType0(DiagnosticRefreshRequest2.method);
      DiagnosticRefreshRequest2.capabilities = messages_1.CM.create("workspace.diagnostics.refreshSupport", void 0);
    })(DiagnosticRefreshRequest || (exports2.DiagnosticRefreshRequest = DiagnosticRefreshRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.notebook.js
var require_protocol_notebook = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.notebook.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DidCloseNotebookDocumentNotification = exports2.DidSaveNotebookDocumentNotification = exports2.DidChangeNotebookDocumentNotification = exports2.NotebookCellArrayChange = exports2.DidOpenNotebookDocumentNotification = exports2.NotebookDocumentSyncRegistrationType = exports2.NotebookDocument = exports2.NotebookCell = exports2.ExecutionSummary = exports2.NotebookCellKind = void 0;
    var vscode_languageserver_types_1 = (init_main(), __toCommonJS(main_exports));
    var Is2 = __importStar(require_is3());
    var messages_1 = require_messages2();
    var NotebookCellKind;
    (function(NotebookCellKind2) {
      NotebookCellKind2.Markup = 1;
      NotebookCellKind2.Code = 2;
      function is(value) {
        return value === 1 || value === 2;
      }
      NotebookCellKind2.is = is;
    })(NotebookCellKind || (exports2.NotebookCellKind = NotebookCellKind = {}));
    var ExecutionSummary;
    (function(ExecutionSummary2) {
      function create(executionOrder, success) {
        const result = { executionOrder };
        if (success === true || success === false) {
          result.success = success;
        }
        return result;
      }
      ExecutionSummary2.create = create;
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && vscode_languageserver_types_1.uinteger.is(candidate.executionOrder) && (candidate.success === void 0 || Is2.boolean(candidate.success));
      }
      ExecutionSummary2.is = is;
      function equals(one, other) {
        if (one === other) {
          return true;
        }
        if (one === null || one === void 0 || other === null || other === void 0) {
          return false;
        }
        return one.executionOrder === other.executionOrder && one.success === other.success;
      }
      ExecutionSummary2.equals = equals;
    })(ExecutionSummary || (exports2.ExecutionSummary = ExecutionSummary = {}));
    var NotebookCell;
    (function(NotebookCell2) {
      function create(kind, document) {
        return { kind, document };
      }
      NotebookCell2.create = create;
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && NotebookCellKind.is(candidate.kind) && vscode_languageserver_types_1.DocumentUri.is(candidate.document) && (candidate.metadata === void 0 || Is2.objectLiteral(candidate.metadata));
      }
      NotebookCell2.is = is;
      function diff(one, two) {
        const result = /* @__PURE__ */ new Set();
        if (one.document !== two.document) {
          result.add("document");
        }
        if (one.kind !== two.kind) {
          result.add("kind");
        }
        if (one.executionSummary !== two.executionSummary) {
          result.add("executionSummary");
        }
        if ((one.metadata !== void 0 || two.metadata !== void 0) && !equalsMetadata(one.metadata, two.metadata)) {
          result.add("metadata");
        }
        if ((one.executionSummary !== void 0 || two.executionSummary !== void 0) && !ExecutionSummary.equals(one.executionSummary, two.executionSummary)) {
          result.add("executionSummary");
        }
        return result;
      }
      NotebookCell2.diff = diff;
      function equalsMetadata(one, other) {
        if (one === other) {
          return true;
        }
        if (one === null || one === void 0 || other === null || other === void 0) {
          return false;
        }
        if (typeof one !== typeof other) {
          return false;
        }
        if (typeof one !== "object") {
          return false;
        }
        const oneArray = Array.isArray(one);
        const otherArray = Array.isArray(other);
        if (oneArray !== otherArray) {
          return false;
        }
        if (oneArray && otherArray) {
          if (one.length !== other.length) {
            return false;
          }
          for (let i2 = 0; i2 < one.length; i2++) {
            if (!equalsMetadata(one[i2], other[i2])) {
              return false;
            }
          }
        }
        if (Is2.objectLiteral(one) && Is2.objectLiteral(other)) {
          const oneKeys = Object.keys(one);
          const otherKeys = Object.keys(other);
          if (oneKeys.length !== otherKeys.length) {
            return false;
          }
          oneKeys.sort();
          otherKeys.sort();
          if (!equalsMetadata(oneKeys, otherKeys)) {
            return false;
          }
          for (let i2 = 0; i2 < oneKeys.length; i2++) {
            const prop = oneKeys[i2];
            if (!equalsMetadata(one[prop], other[prop])) {
              return false;
            }
          }
        }
        return true;
      }
    })(NotebookCell || (exports2.NotebookCell = NotebookCell = {}));
    var NotebookDocument;
    (function(NotebookDocument2) {
      function create(uri, notebookType, version, cells) {
        return { uri, notebookType, version, cells };
      }
      NotebookDocument2.create = create;
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && Is2.string(candidate.uri) && vscode_languageserver_types_1.integer.is(candidate.version) && Is2.typedArray(candidate.cells, NotebookCell.is);
      }
      NotebookDocument2.is = is;
    })(NotebookDocument || (exports2.NotebookDocument = NotebookDocument = {}));
    var NotebookDocumentSyncRegistrationType;
    (function(NotebookDocumentSyncRegistrationType2) {
      NotebookDocumentSyncRegistrationType2.method = "notebookDocument/sync";
      NotebookDocumentSyncRegistrationType2.messageDirection = messages_1.MessageDirection.clientToServer;
      NotebookDocumentSyncRegistrationType2.type = new messages_1.RegistrationType(NotebookDocumentSyncRegistrationType2.method);
    })(NotebookDocumentSyncRegistrationType || (exports2.NotebookDocumentSyncRegistrationType = NotebookDocumentSyncRegistrationType = {}));
    var DidOpenNotebookDocumentNotification;
    (function(DidOpenNotebookDocumentNotification2) {
      DidOpenNotebookDocumentNotification2.method = "notebookDocument/didOpen";
      DidOpenNotebookDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidOpenNotebookDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidOpenNotebookDocumentNotification2.method);
      DidOpenNotebookDocumentNotification2.registrationMethod = NotebookDocumentSyncRegistrationType.method;
    })(DidOpenNotebookDocumentNotification || (exports2.DidOpenNotebookDocumentNotification = DidOpenNotebookDocumentNotification = {}));
    var NotebookCellArrayChange;
    (function(NotebookCellArrayChange2) {
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && vscode_languageserver_types_1.uinteger.is(candidate.start) && vscode_languageserver_types_1.uinteger.is(candidate.deleteCount) && (candidate.cells === void 0 || Is2.typedArray(candidate.cells, NotebookCell.is));
      }
      NotebookCellArrayChange2.is = is;
      function create(start, deleteCount, cells) {
        const result = { start, deleteCount };
        if (cells !== void 0) {
          result.cells = cells;
        }
        return result;
      }
      NotebookCellArrayChange2.create = create;
    })(NotebookCellArrayChange || (exports2.NotebookCellArrayChange = NotebookCellArrayChange = {}));
    var DidChangeNotebookDocumentNotification;
    (function(DidChangeNotebookDocumentNotification2) {
      DidChangeNotebookDocumentNotification2.method = "notebookDocument/didChange";
      DidChangeNotebookDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidChangeNotebookDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidChangeNotebookDocumentNotification2.method);
      DidChangeNotebookDocumentNotification2.registrationMethod = NotebookDocumentSyncRegistrationType.method;
    })(DidChangeNotebookDocumentNotification || (exports2.DidChangeNotebookDocumentNotification = DidChangeNotebookDocumentNotification = {}));
    var DidSaveNotebookDocumentNotification;
    (function(DidSaveNotebookDocumentNotification2) {
      DidSaveNotebookDocumentNotification2.method = "notebookDocument/didSave";
      DidSaveNotebookDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidSaveNotebookDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidSaveNotebookDocumentNotification2.method);
      DidSaveNotebookDocumentNotification2.registrationMethod = NotebookDocumentSyncRegistrationType.method;
    })(DidSaveNotebookDocumentNotification || (exports2.DidSaveNotebookDocumentNotification = DidSaveNotebookDocumentNotification = {}));
    var DidCloseNotebookDocumentNotification;
    (function(DidCloseNotebookDocumentNotification2) {
      DidCloseNotebookDocumentNotification2.method = "notebookDocument/didClose";
      DidCloseNotebookDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidCloseNotebookDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidCloseNotebookDocumentNotification2.method);
      DidCloseNotebookDocumentNotification2.registrationMethod = NotebookDocumentSyncRegistrationType.method;
    })(DidCloseNotebookDocumentNotification || (exports2.DidCloseNotebookDocumentNotification = DidCloseNotebookDocumentNotification = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlineCompletion.js
var require_protocol_inlineCompletion = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.inlineCompletion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InlineCompletionRequest = void 0;
    var messages_1 = require_messages2();
    var InlineCompletionRequest;
    (function(InlineCompletionRequest2) {
      InlineCompletionRequest2.method = "textDocument/inlineCompletion";
      InlineCompletionRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      InlineCompletionRequest2.type = new messages_1.ProtocolRequestType(InlineCompletionRequest2.method);
      InlineCompletionRequest2.capabilities = messages_1.CM.create("textDocument.inlineCompletion", "inlineCompletionProvider");
    })(InlineCompletionRequest || (exports2.InlineCompletionRequest = InlineCompletionRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.textDocumentContent.js
var require_protocol_textDocumentContent = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.textDocumentContent.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TextDocumentContentRefreshRequest = exports2.TextDocumentContentRequest = void 0;
    var messages_1 = require_messages2();
    var TextDocumentContentRequest;
    (function(TextDocumentContentRequest2) {
      TextDocumentContentRequest2.method = "workspace/textDocumentContent";
      TextDocumentContentRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      TextDocumentContentRequest2.type = new messages_1.ProtocolRequestType(TextDocumentContentRequest2.method);
      TextDocumentContentRequest2.capabilities = messages_1.CM.create("workspace.textDocumentContent", "workspace.textDocumentContent");
    })(TextDocumentContentRequest || (exports2.TextDocumentContentRequest = TextDocumentContentRequest = {}));
    var TextDocumentContentRefreshRequest;
    (function(TextDocumentContentRefreshRequest2) {
      TextDocumentContentRefreshRequest2.method = `workspace/textDocumentContent/refresh`;
      TextDocumentContentRefreshRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      TextDocumentContentRefreshRequest2.type = new messages_1.ProtocolRequestType(TextDocumentContentRefreshRequest2.method);
    })(TextDocumentContentRefreshRequest || (exports2.TextDocumentContentRefreshRequest = TextDocumentContentRefreshRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/protocol.js
var require_protocol = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/protocol.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CodeActionRequest = exports2.DocumentSymbolRequest = exports2.DocumentHighlightRequest = exports2.ReferencesRequest = exports2.DefinitionRequest = exports2.SignatureHelpRequest = exports2.SignatureHelpTriggerKind = exports2.HoverRequest = exports2.CompletionResolveRequest = exports2.CompletionRequest = exports2.CompletionTriggerKind = exports2.PublishDiagnosticsNotification = exports2.WatchKind = exports2.GlobPattern = exports2.RelativePattern = exports2.FileChangeType = exports2.DidChangeWatchedFilesNotification = exports2.WillSaveTextDocumentWaitUntilRequest = exports2.WillSaveTextDocumentNotification = exports2.TextDocumentSaveReason = exports2.DidSaveTextDocumentNotification = exports2.DidCloseTextDocumentNotification = exports2.DidChangeTextDocumentNotification = exports2.TextDocumentContentChangeEvent = exports2.DidOpenTextDocumentNotification = exports2.TextDocumentSyncKind = exports2.TelemetryEventNotification = exports2.LogMessageNotification = exports2.ShowMessageRequest = exports2.ShowMessageNotification = exports2.MessageType = exports2.DidChangeConfigurationNotification = exports2.ExitNotification = exports2.ShutdownRequest = exports2.InitializedNotification = exports2.InitializeErrorCodes = exports2.InitializeRequest = exports2.WorkDoneProgressOptions = exports2.TextDocumentRegistrationOptions = exports2.StaticRegistrationOptions = exports2.PositionEncodingKind = exports2.RegularExpressionEngineKind = exports2.FailureHandlingKind = exports2.ResourceOperationKind = exports2.UnregistrationRequest = exports2.RegistrationRequest = exports2.DocumentSelector = exports2.NotebookCellTextDocumentFilter = exports2.NotebookDocumentFilter = exports2.TextDocumentFilter = void 0;
    exports2.UniquenessLevel = exports2.WillDeleteFilesRequest = exports2.DidDeleteFilesNotification = exports2.WillRenameFilesRequest = exports2.DidRenameFilesNotification = exports2.WillCreateFilesRequest = exports2.DidCreateFilesNotification = exports2.FileOperationPatternKind = exports2.LinkedEditingRangeRequest = exports2.ShowDocumentRequest = exports2.SemanticTokensRegistrationType = exports2.SemanticTokensRefreshRequest = exports2.SemanticTokensRangeRequest = exports2.SemanticTokensDeltaRequest = exports2.SemanticTokensRequest = exports2.TokenFormat = exports2.CallHierarchyPrepareRequest = exports2.CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyIncomingCallsRequest = exports2.WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCreateRequest = exports2.WorkDoneProgress = exports2.SelectionRangeRequest = exports2.DeclarationRequest = exports2.FoldingRangeRefreshRequest = exports2.FoldingRangeRequest = exports2.ColorPresentationRequest = exports2.DocumentColorRequest = exports2.ConfigurationRequest = exports2.DidChangeWorkspaceFoldersNotification = exports2.WorkspaceFoldersRequest = exports2.TypeDefinitionRequest = exports2.ImplementationRequest = exports2.ApplyWorkspaceEditRequest = exports2.ExecuteCommandRequest = exports2.PrepareRenameRequest = exports2.RenameRequest = exports2.PrepareSupportDefaultBehavior = exports2.DocumentOnTypeFormattingRequest = exports2.DocumentRangesFormattingRequest = exports2.DocumentRangeFormattingRequest = exports2.DocumentFormattingRequest = exports2.DocumentLinkResolveRequest = exports2.DocumentLinkRequest = exports2.CodeLensRefreshRequest = exports2.CodeLensResolveRequest = exports2.CodeLensRequest = exports2.WorkspaceSymbolResolveRequest = exports2.WorkspaceSymbolRequest = exports2.CodeActionResolveRequest = void 0;
    exports2.TextDocumentContentRefreshRequest = exports2.TextDocumentContentRequest = exports2.InlineCompletionRequest = exports2.DidCloseNotebookDocumentNotification = exports2.DidSaveNotebookDocumentNotification = exports2.DidChangeNotebookDocumentNotification = exports2.NotebookCellArrayChange = exports2.DidOpenNotebookDocumentNotification = exports2.NotebookDocumentSyncRegistrationType = exports2.NotebookDocument = exports2.NotebookCell = exports2.ExecutionSummary = exports2.NotebookCellKind = exports2.DiagnosticRefreshRequest = exports2.WorkspaceDiagnosticRequest = exports2.DocumentDiagnosticRequest = exports2.DocumentDiagnosticReportKind = exports2.DiagnosticServerCancellationData = exports2.InlayHintRefreshRequest = exports2.InlayHintResolveRequest = exports2.InlayHintRequest = exports2.InlineValueRefreshRequest = exports2.InlineValueRequest = exports2.TypeHierarchySupertypesRequest = exports2.TypeHierarchySubtypesRequest = exports2.TypeHierarchyPrepareRequest = exports2.MonikerRequest = exports2.MonikerKind = void 0;
    var messages_1 = require_messages2();
    var vscode_languageserver_types_1 = (init_main(), __toCommonJS(main_exports));
    var Is2 = __importStar(require_is3());
    var protocol_implementation_1 = require_protocol_implementation();
    Object.defineProperty(exports2, "ImplementationRequest", { enumerable: true, get: function() {
      return protocol_implementation_1.ImplementationRequest;
    } });
    var protocol_typeDefinition_1 = require_protocol_typeDefinition();
    Object.defineProperty(exports2, "TypeDefinitionRequest", { enumerable: true, get: function() {
      return protocol_typeDefinition_1.TypeDefinitionRequest;
    } });
    var protocol_workspaceFolder_1 = require_protocol_workspaceFolder();
    Object.defineProperty(exports2, "WorkspaceFoldersRequest", { enumerable: true, get: function() {
      return protocol_workspaceFolder_1.WorkspaceFoldersRequest;
    } });
    Object.defineProperty(exports2, "DidChangeWorkspaceFoldersNotification", { enumerable: true, get: function() {
      return protocol_workspaceFolder_1.DidChangeWorkspaceFoldersNotification;
    } });
    var protocol_configuration_1 = require_protocol_configuration();
    Object.defineProperty(exports2, "ConfigurationRequest", { enumerable: true, get: function() {
      return protocol_configuration_1.ConfigurationRequest;
    } });
    var protocol_colorProvider_1 = require_protocol_colorProvider();
    Object.defineProperty(exports2, "DocumentColorRequest", { enumerable: true, get: function() {
      return protocol_colorProvider_1.DocumentColorRequest;
    } });
    Object.defineProperty(exports2, "ColorPresentationRequest", { enumerable: true, get: function() {
      return protocol_colorProvider_1.ColorPresentationRequest;
    } });
    var protocol_foldingRange_1 = require_protocol_foldingRange();
    Object.defineProperty(exports2, "FoldingRangeRequest", { enumerable: true, get: function() {
      return protocol_foldingRange_1.FoldingRangeRequest;
    } });
    Object.defineProperty(exports2, "FoldingRangeRefreshRequest", { enumerable: true, get: function() {
      return protocol_foldingRange_1.FoldingRangeRefreshRequest;
    } });
    var protocol_declaration_1 = require_protocol_declaration();
    Object.defineProperty(exports2, "DeclarationRequest", { enumerable: true, get: function() {
      return protocol_declaration_1.DeclarationRequest;
    } });
    var protocol_selectionRange_1 = require_protocol_selectionRange();
    Object.defineProperty(exports2, "SelectionRangeRequest", { enumerable: true, get: function() {
      return protocol_selectionRange_1.SelectionRangeRequest;
    } });
    var protocol_progress_1 = require_protocol_progress();
    Object.defineProperty(exports2, "WorkDoneProgress", { enumerable: true, get: function() {
      return protocol_progress_1.WorkDoneProgress;
    } });
    Object.defineProperty(exports2, "WorkDoneProgressCreateRequest", { enumerable: true, get: function() {
      return protocol_progress_1.WorkDoneProgressCreateRequest;
    } });
    Object.defineProperty(exports2, "WorkDoneProgressCancelNotification", { enumerable: true, get: function() {
      return protocol_progress_1.WorkDoneProgressCancelNotification;
    } });
    var protocol_callHierarchy_1 = require_protocol_callHierarchy();
    Object.defineProperty(exports2, "CallHierarchyIncomingCallsRequest", { enumerable: true, get: function() {
      return protocol_callHierarchy_1.CallHierarchyIncomingCallsRequest;
    } });
    Object.defineProperty(exports2, "CallHierarchyOutgoingCallsRequest", { enumerable: true, get: function() {
      return protocol_callHierarchy_1.CallHierarchyOutgoingCallsRequest;
    } });
    Object.defineProperty(exports2, "CallHierarchyPrepareRequest", { enumerable: true, get: function() {
      return protocol_callHierarchy_1.CallHierarchyPrepareRequest;
    } });
    var protocol_semanticTokens_1 = require_protocol_semanticTokens();
    Object.defineProperty(exports2, "TokenFormat", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.TokenFormat;
    } });
    Object.defineProperty(exports2, "SemanticTokensRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensDeltaRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensDeltaRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensRangeRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRangeRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensRefreshRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRefreshRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensRegistrationType", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRegistrationType;
    } });
    var protocol_showDocument_1 = require_protocol_showDocument();
    Object.defineProperty(exports2, "ShowDocumentRequest", { enumerable: true, get: function() {
      return protocol_showDocument_1.ShowDocumentRequest;
    } });
    var protocol_linkedEditingRange_1 = require_protocol_linkedEditingRange();
    Object.defineProperty(exports2, "LinkedEditingRangeRequest", { enumerable: true, get: function() {
      return protocol_linkedEditingRange_1.LinkedEditingRangeRequest;
    } });
    var protocol_fileOperations_1 = require_protocol_fileOperations();
    Object.defineProperty(exports2, "FileOperationPatternKind", { enumerable: true, get: function() {
      return protocol_fileOperations_1.FileOperationPatternKind;
    } });
    Object.defineProperty(exports2, "DidCreateFilesNotification", { enumerable: true, get: function() {
      return protocol_fileOperations_1.DidCreateFilesNotification;
    } });
    Object.defineProperty(exports2, "WillCreateFilesRequest", { enumerable: true, get: function() {
      return protocol_fileOperations_1.WillCreateFilesRequest;
    } });
    Object.defineProperty(exports2, "DidRenameFilesNotification", { enumerable: true, get: function() {
      return protocol_fileOperations_1.DidRenameFilesNotification;
    } });
    Object.defineProperty(exports2, "WillRenameFilesRequest", { enumerable: true, get: function() {
      return protocol_fileOperations_1.WillRenameFilesRequest;
    } });
    Object.defineProperty(exports2, "DidDeleteFilesNotification", { enumerable: true, get: function() {
      return protocol_fileOperations_1.DidDeleteFilesNotification;
    } });
    Object.defineProperty(exports2, "WillDeleteFilesRequest", { enumerable: true, get: function() {
      return protocol_fileOperations_1.WillDeleteFilesRequest;
    } });
    var protocol_moniker_1 = require_protocol_moniker();
    Object.defineProperty(exports2, "UniquenessLevel", { enumerable: true, get: function() {
      return protocol_moniker_1.UniquenessLevel;
    } });
    Object.defineProperty(exports2, "MonikerKind", { enumerable: true, get: function() {
      return protocol_moniker_1.MonikerKind;
    } });
    Object.defineProperty(exports2, "MonikerRequest", { enumerable: true, get: function() {
      return protocol_moniker_1.MonikerRequest;
    } });
    var protocol_typeHierarchy_1 = require_protocol_typeHierarchy();
    Object.defineProperty(exports2, "TypeHierarchyPrepareRequest", { enumerable: true, get: function() {
      return protocol_typeHierarchy_1.TypeHierarchyPrepareRequest;
    } });
    Object.defineProperty(exports2, "TypeHierarchySubtypesRequest", { enumerable: true, get: function() {
      return protocol_typeHierarchy_1.TypeHierarchySubtypesRequest;
    } });
    Object.defineProperty(exports2, "TypeHierarchySupertypesRequest", { enumerable: true, get: function() {
      return protocol_typeHierarchy_1.TypeHierarchySupertypesRequest;
    } });
    var protocol_inlineValue_1 = require_protocol_inlineValue();
    Object.defineProperty(exports2, "InlineValueRequest", { enumerable: true, get: function() {
      return protocol_inlineValue_1.InlineValueRequest;
    } });
    Object.defineProperty(exports2, "InlineValueRefreshRequest", { enumerable: true, get: function() {
      return protocol_inlineValue_1.InlineValueRefreshRequest;
    } });
    var protocol_inlayHint_1 = require_protocol_inlayHint();
    Object.defineProperty(exports2, "InlayHintRequest", { enumerable: true, get: function() {
      return protocol_inlayHint_1.InlayHintRequest;
    } });
    Object.defineProperty(exports2, "InlayHintResolveRequest", { enumerable: true, get: function() {
      return protocol_inlayHint_1.InlayHintResolveRequest;
    } });
    Object.defineProperty(exports2, "InlayHintRefreshRequest", { enumerable: true, get: function() {
      return protocol_inlayHint_1.InlayHintRefreshRequest;
    } });
    var protocol_diagnostic_1 = require_protocol_diagnostic();
    Object.defineProperty(exports2, "DiagnosticServerCancellationData", { enumerable: true, get: function() {
      return protocol_diagnostic_1.DiagnosticServerCancellationData;
    } });
    Object.defineProperty(exports2, "DocumentDiagnosticReportKind", { enumerable: true, get: function() {
      return protocol_diagnostic_1.DocumentDiagnosticReportKind;
    } });
    Object.defineProperty(exports2, "DocumentDiagnosticRequest", { enumerable: true, get: function() {
      return protocol_diagnostic_1.DocumentDiagnosticRequest;
    } });
    Object.defineProperty(exports2, "WorkspaceDiagnosticRequest", { enumerable: true, get: function() {
      return protocol_diagnostic_1.WorkspaceDiagnosticRequest;
    } });
    Object.defineProperty(exports2, "DiagnosticRefreshRequest", { enumerable: true, get: function() {
      return protocol_diagnostic_1.DiagnosticRefreshRequest;
    } });
    var protocol_notebook_1 = require_protocol_notebook();
    Object.defineProperty(exports2, "NotebookCellKind", { enumerable: true, get: function() {
      return protocol_notebook_1.NotebookCellKind;
    } });
    Object.defineProperty(exports2, "ExecutionSummary", { enumerable: true, get: function() {
      return protocol_notebook_1.ExecutionSummary;
    } });
    Object.defineProperty(exports2, "NotebookCell", { enumerable: true, get: function() {
      return protocol_notebook_1.NotebookCell;
    } });
    Object.defineProperty(exports2, "NotebookDocument", { enumerable: true, get: function() {
      return protocol_notebook_1.NotebookDocument;
    } });
    Object.defineProperty(exports2, "NotebookDocumentSyncRegistrationType", { enumerable: true, get: function() {
      return protocol_notebook_1.NotebookDocumentSyncRegistrationType;
    } });
    Object.defineProperty(exports2, "DidOpenNotebookDocumentNotification", { enumerable: true, get: function() {
      return protocol_notebook_1.DidOpenNotebookDocumentNotification;
    } });
    Object.defineProperty(exports2, "NotebookCellArrayChange", { enumerable: true, get: function() {
      return protocol_notebook_1.NotebookCellArrayChange;
    } });
    Object.defineProperty(exports2, "DidChangeNotebookDocumentNotification", { enumerable: true, get: function() {
      return protocol_notebook_1.DidChangeNotebookDocumentNotification;
    } });
    Object.defineProperty(exports2, "DidSaveNotebookDocumentNotification", { enumerable: true, get: function() {
      return protocol_notebook_1.DidSaveNotebookDocumentNotification;
    } });
    Object.defineProperty(exports2, "DidCloseNotebookDocumentNotification", { enumerable: true, get: function() {
      return protocol_notebook_1.DidCloseNotebookDocumentNotification;
    } });
    var protocol_inlineCompletion_1 = require_protocol_inlineCompletion();
    Object.defineProperty(exports2, "InlineCompletionRequest", { enumerable: true, get: function() {
      return protocol_inlineCompletion_1.InlineCompletionRequest;
    } });
    var protocol_textDocumentContent_1 = require_protocol_textDocumentContent();
    Object.defineProperty(exports2, "TextDocumentContentRequest", { enumerable: true, get: function() {
      return protocol_textDocumentContent_1.TextDocumentContentRequest;
    } });
    Object.defineProperty(exports2, "TextDocumentContentRefreshRequest", { enumerable: true, get: function() {
      return protocol_textDocumentContent_1.TextDocumentContentRefreshRequest;
    } });
    var TextDocumentFilter;
    (function(TextDocumentFilter2) {
      function is(value) {
        const candidate = value;
        return Is2.string(candidate) || (Is2.string(candidate.language) || Is2.string(candidate.scheme) || GlobPattern.is(candidate.pattern));
      }
      TextDocumentFilter2.is = is;
    })(TextDocumentFilter || (exports2.TextDocumentFilter = TextDocumentFilter = {}));
    var NotebookDocumentFilter;
    (function(NotebookDocumentFilter2) {
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && (Is2.string(candidate.notebookType) || Is2.string(candidate.scheme) || Is2.string(candidate.pattern));
      }
      NotebookDocumentFilter2.is = is;
    })(NotebookDocumentFilter || (exports2.NotebookDocumentFilter = NotebookDocumentFilter = {}));
    var NotebookCellTextDocumentFilter;
    (function(NotebookCellTextDocumentFilter2) {
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && (Is2.string(candidate.notebook) || NotebookDocumentFilter.is(candidate.notebook)) && (candidate.language === void 0 || Is2.string(candidate.language));
      }
      NotebookCellTextDocumentFilter2.is = is;
    })(NotebookCellTextDocumentFilter || (exports2.NotebookCellTextDocumentFilter = NotebookCellTextDocumentFilter = {}));
    var DocumentSelector;
    (function(DocumentSelector2) {
      function is(value) {
        if (!Array.isArray(value)) {
          return false;
        }
        for (const elem of value) {
          if (!Is2.string(elem) && !TextDocumentFilter.is(elem) && !NotebookCellTextDocumentFilter.is(elem)) {
            return false;
          }
        }
        return true;
      }
      DocumentSelector2.is = is;
    })(DocumentSelector || (exports2.DocumentSelector = DocumentSelector = {}));
    var RegistrationRequest;
    (function(RegistrationRequest2) {
      RegistrationRequest2.method = "client/registerCapability";
      RegistrationRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      RegistrationRequest2.type = new messages_1.ProtocolRequestType(RegistrationRequest2.method);
    })(RegistrationRequest || (exports2.RegistrationRequest = RegistrationRequest = {}));
    var UnregistrationRequest;
    (function(UnregistrationRequest2) {
      UnregistrationRequest2.method = "client/unregisterCapability";
      UnregistrationRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      UnregistrationRequest2.type = new messages_1.ProtocolRequestType(UnregistrationRequest2.method);
    })(UnregistrationRequest || (exports2.UnregistrationRequest = UnregistrationRequest = {}));
    var ResourceOperationKind;
    (function(ResourceOperationKind2) {
      ResourceOperationKind2.Create = "create";
      ResourceOperationKind2.Rename = "rename";
      ResourceOperationKind2.Delete = "delete";
    })(ResourceOperationKind || (exports2.ResourceOperationKind = ResourceOperationKind = {}));
    var FailureHandlingKind;
    (function(FailureHandlingKind2) {
      FailureHandlingKind2.Abort = "abort";
      FailureHandlingKind2.Transactional = "transactional";
      FailureHandlingKind2.TextOnlyTransactional = "textOnlyTransactional";
      FailureHandlingKind2.Undo = "undo";
    })(FailureHandlingKind || (exports2.FailureHandlingKind = FailureHandlingKind = {}));
    var RegularExpressionEngineKind;
    (function(RegularExpressionEngineKind2) {
      RegularExpressionEngineKind2.ES2020 = "ES2020";
    })(RegularExpressionEngineKind || (exports2.RegularExpressionEngineKind = RegularExpressionEngineKind = {}));
    var PositionEncodingKind;
    (function(PositionEncodingKind2) {
      PositionEncodingKind2.UTF8 = "utf-8";
      PositionEncodingKind2.UTF16 = "utf-16";
      PositionEncodingKind2.UTF32 = "utf-32";
    })(PositionEncodingKind || (exports2.PositionEncodingKind = PositionEncodingKind = {}));
    var StaticRegistrationOptions;
    (function(StaticRegistrationOptions2) {
      function hasId(value) {
        const candidate = value;
        return candidate && Is2.string(candidate.id) && candidate.id.length > 0;
      }
      StaticRegistrationOptions2.hasId = hasId;
    })(StaticRegistrationOptions || (exports2.StaticRegistrationOptions = StaticRegistrationOptions = {}));
    var TextDocumentRegistrationOptions;
    (function(TextDocumentRegistrationOptions2) {
      function is(value) {
        const candidate = value;
        return candidate && (candidate.documentSelector === null || DocumentSelector.is(candidate.documentSelector));
      }
      TextDocumentRegistrationOptions2.is = is;
    })(TextDocumentRegistrationOptions || (exports2.TextDocumentRegistrationOptions = TextDocumentRegistrationOptions = {}));
    var WorkDoneProgressOptions;
    (function(WorkDoneProgressOptions2) {
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && (candidate.workDoneProgress === void 0 || Is2.boolean(candidate.workDoneProgress));
      }
      WorkDoneProgressOptions2.is = is;
      function hasWorkDoneProgress(value) {
        const candidate = value;
        return candidate && Is2.boolean(candidate.workDoneProgress);
      }
      WorkDoneProgressOptions2.hasWorkDoneProgress = hasWorkDoneProgress;
    })(WorkDoneProgressOptions || (exports2.WorkDoneProgressOptions = WorkDoneProgressOptions = {}));
    var InitializeRequest;
    (function(InitializeRequest2) {
      InitializeRequest2.method = "initialize";
      InitializeRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      InitializeRequest2.type = new messages_1.ProtocolRequestType(InitializeRequest2.method);
    })(InitializeRequest || (exports2.InitializeRequest = InitializeRequest = {}));
    var InitializeErrorCodes;
    (function(InitializeErrorCodes2) {
      InitializeErrorCodes2.unknownProtocolVersion = 1;
    })(InitializeErrorCodes || (exports2.InitializeErrorCodes = InitializeErrorCodes = {}));
    var InitializedNotification;
    (function(InitializedNotification2) {
      InitializedNotification2.method = "initialized";
      InitializedNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      InitializedNotification2.type = new messages_1.ProtocolNotificationType(InitializedNotification2.method);
    })(InitializedNotification || (exports2.InitializedNotification = InitializedNotification = {}));
    var ShutdownRequest;
    (function(ShutdownRequest2) {
      ShutdownRequest2.method = "shutdown";
      ShutdownRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      ShutdownRequest2.type = new messages_1.ProtocolRequestType0(ShutdownRequest2.method);
    })(ShutdownRequest || (exports2.ShutdownRequest = ShutdownRequest = {}));
    var ExitNotification;
    (function(ExitNotification2) {
      ExitNotification2.method = "exit";
      ExitNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      ExitNotification2.type = new messages_1.ProtocolNotificationType0(ExitNotification2.method);
    })(ExitNotification || (exports2.ExitNotification = ExitNotification = {}));
    var DidChangeConfigurationNotification;
    (function(DidChangeConfigurationNotification2) {
      DidChangeConfigurationNotification2.method = "workspace/didChangeConfiguration";
      DidChangeConfigurationNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidChangeConfigurationNotification2.type = new messages_1.ProtocolNotificationType(DidChangeConfigurationNotification2.method);
      DidChangeConfigurationNotification2.capabilities = messages_1.CM.create("workspace.didChangeConfiguration", void 0);
    })(DidChangeConfigurationNotification || (exports2.DidChangeConfigurationNotification = DidChangeConfigurationNotification = {}));
    var MessageType;
    (function(MessageType2) {
      MessageType2.Error = 1;
      MessageType2.Warning = 2;
      MessageType2.Info = 3;
      MessageType2.Log = 4;
      MessageType2.Debug = 5;
    })(MessageType || (exports2.MessageType = MessageType = {}));
    var ShowMessageNotification;
    (function(ShowMessageNotification2) {
      ShowMessageNotification2.method = "window/showMessage";
      ShowMessageNotification2.messageDirection = messages_1.MessageDirection.serverToClient;
      ShowMessageNotification2.type = new messages_1.ProtocolNotificationType(ShowMessageNotification2.method);
      ShowMessageNotification2.capabilities = messages_1.CM.create("window.showMessage", void 0);
    })(ShowMessageNotification || (exports2.ShowMessageNotification = ShowMessageNotification = {}));
    var ShowMessageRequest;
    (function(ShowMessageRequest2) {
      ShowMessageRequest2.method = "window/showMessageRequest";
      ShowMessageRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      ShowMessageRequest2.type = new messages_1.ProtocolRequestType(ShowMessageRequest2.method);
      ShowMessageRequest2.capabilities = messages_1.CM.create("window.showMessage", void 0);
    })(ShowMessageRequest || (exports2.ShowMessageRequest = ShowMessageRequest = {}));
    var LogMessageNotification;
    (function(LogMessageNotification2) {
      LogMessageNotification2.method = "window/logMessage";
      LogMessageNotification2.messageDirection = messages_1.MessageDirection.serverToClient;
      LogMessageNotification2.type = new messages_1.ProtocolNotificationType(LogMessageNotification2.method);
    })(LogMessageNotification || (exports2.LogMessageNotification = LogMessageNotification = {}));
    var TelemetryEventNotification;
    (function(TelemetryEventNotification2) {
      TelemetryEventNotification2.method = "telemetry/event";
      TelemetryEventNotification2.messageDirection = messages_1.MessageDirection.serverToClient;
      TelemetryEventNotification2.type = new messages_1.ProtocolNotificationType(TelemetryEventNotification2.method);
    })(TelemetryEventNotification || (exports2.TelemetryEventNotification = TelemetryEventNotification = {}));
    var TextDocumentSyncKind2;
    (function(TextDocumentSyncKind3) {
      TextDocumentSyncKind3.None = 0;
      TextDocumentSyncKind3.Full = 1;
      TextDocumentSyncKind3.Incremental = 2;
    })(TextDocumentSyncKind2 || (exports2.TextDocumentSyncKind = TextDocumentSyncKind2 = {}));
    var DidOpenTextDocumentNotification;
    (function(DidOpenTextDocumentNotification2) {
      DidOpenTextDocumentNotification2.method = "textDocument/didOpen";
      DidOpenTextDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidOpenTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidOpenTextDocumentNotification2.method);
      DidOpenTextDocumentNotification2.capabilities = messages_1.CM.create("textDocument.synchronization", "textDocumentSync.openClose");
    })(DidOpenTextDocumentNotification || (exports2.DidOpenTextDocumentNotification = DidOpenTextDocumentNotification = {}));
    var TextDocumentContentChangeEvent;
    (function(TextDocumentContentChangeEvent2) {
      function isIncremental(event) {
        const candidate = event;
        return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range !== void 0 && (candidate.rangeLength === void 0 || typeof candidate.rangeLength === "number");
      }
      TextDocumentContentChangeEvent2.isIncremental = isIncremental;
      function isFull(event) {
        const candidate = event;
        return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range === void 0 && candidate.rangeLength === void 0;
      }
      TextDocumentContentChangeEvent2.isFull = isFull;
    })(TextDocumentContentChangeEvent || (exports2.TextDocumentContentChangeEvent = TextDocumentContentChangeEvent = {}));
    var DidChangeTextDocumentNotification;
    (function(DidChangeTextDocumentNotification2) {
      DidChangeTextDocumentNotification2.method = "textDocument/didChange";
      DidChangeTextDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidChangeTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidChangeTextDocumentNotification2.method);
      DidChangeTextDocumentNotification2.capabilities = messages_1.CM.create("textDocument.synchronization", "textDocumentSync");
    })(DidChangeTextDocumentNotification || (exports2.DidChangeTextDocumentNotification = DidChangeTextDocumentNotification = {}));
    var DidCloseTextDocumentNotification;
    (function(DidCloseTextDocumentNotification2) {
      DidCloseTextDocumentNotification2.method = "textDocument/didClose";
      DidCloseTextDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidCloseTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidCloseTextDocumentNotification2.method);
      DidCloseTextDocumentNotification2.capabilities = messages_1.CM.create("textDocument.synchronization", "textDocumentSync.openClose");
    })(DidCloseTextDocumentNotification || (exports2.DidCloseTextDocumentNotification = DidCloseTextDocumentNotification = {}));
    var DidSaveTextDocumentNotification;
    (function(DidSaveTextDocumentNotification2) {
      DidSaveTextDocumentNotification2.method = "textDocument/didSave";
      DidSaveTextDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidSaveTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidSaveTextDocumentNotification2.method);
      DidSaveTextDocumentNotification2.capabilities = messages_1.CM.create("textDocument.synchronization.didSave", "textDocumentSync.save");
    })(DidSaveTextDocumentNotification || (exports2.DidSaveTextDocumentNotification = DidSaveTextDocumentNotification = {}));
    var TextDocumentSaveReason;
    (function(TextDocumentSaveReason2) {
      TextDocumentSaveReason2.Manual = 1;
      TextDocumentSaveReason2.AfterDelay = 2;
      TextDocumentSaveReason2.FocusOut = 3;
    })(TextDocumentSaveReason || (exports2.TextDocumentSaveReason = TextDocumentSaveReason = {}));
    var WillSaveTextDocumentNotification;
    (function(WillSaveTextDocumentNotification2) {
      WillSaveTextDocumentNotification2.method = "textDocument/willSave";
      WillSaveTextDocumentNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      WillSaveTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(WillSaveTextDocumentNotification2.method);
      WillSaveTextDocumentNotification2.capabilities = messages_1.CM.create("textDocument.synchronization.willSave", "textDocumentSync.willSave");
    })(WillSaveTextDocumentNotification || (exports2.WillSaveTextDocumentNotification = WillSaveTextDocumentNotification = {}));
    var WillSaveTextDocumentWaitUntilRequest;
    (function(WillSaveTextDocumentWaitUntilRequest2) {
      WillSaveTextDocumentWaitUntilRequest2.method = "textDocument/willSaveWaitUntil";
      WillSaveTextDocumentWaitUntilRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      WillSaveTextDocumentWaitUntilRequest2.type = new messages_1.ProtocolRequestType(WillSaveTextDocumentWaitUntilRequest2.method);
      WillSaveTextDocumentWaitUntilRequest2.capabilities = messages_1.CM.create("textDocument.synchronization.willSaveWaitUntil", "textDocumentSync.willSaveWaitUntil");
    })(WillSaveTextDocumentWaitUntilRequest || (exports2.WillSaveTextDocumentWaitUntilRequest = WillSaveTextDocumentWaitUntilRequest = {}));
    var DidChangeWatchedFilesNotification;
    (function(DidChangeWatchedFilesNotification2) {
      DidChangeWatchedFilesNotification2.method = "workspace/didChangeWatchedFiles";
      DidChangeWatchedFilesNotification2.messageDirection = messages_1.MessageDirection.clientToServer;
      DidChangeWatchedFilesNotification2.type = new messages_1.ProtocolNotificationType(DidChangeWatchedFilesNotification2.method);
      DidChangeWatchedFilesNotification2.capabilities = messages_1.CM.create("workspace.didChangeWatchedFiles", void 0);
    })(DidChangeWatchedFilesNotification || (exports2.DidChangeWatchedFilesNotification = DidChangeWatchedFilesNotification = {}));
    var FileChangeType2;
    (function(FileChangeType3) {
      FileChangeType3.Created = 1;
      FileChangeType3.Changed = 2;
      FileChangeType3.Deleted = 3;
    })(FileChangeType2 || (exports2.FileChangeType = FileChangeType2 = {}));
    var RelativePattern;
    (function(RelativePattern2) {
      function is(value) {
        const candidate = value;
        return Is2.objectLiteral(candidate) && (vscode_languageserver_types_1.URI.is(candidate.baseUri) || vscode_languageserver_types_1.WorkspaceFolder.is(candidate.baseUri)) && Is2.string(candidate.pattern);
      }
      RelativePattern2.is = is;
    })(RelativePattern || (exports2.RelativePattern = RelativePattern = {}));
    var GlobPattern;
    (function(GlobPattern2) {
      function is(value) {
        const candidate = value;
        return Is2.string(candidate) || RelativePattern.is(candidate);
      }
      GlobPattern2.is = is;
    })(GlobPattern || (exports2.GlobPattern = GlobPattern = {}));
    var WatchKind;
    (function(WatchKind2) {
      WatchKind2.Create = 1;
      WatchKind2.Change = 2;
      WatchKind2.Delete = 4;
    })(WatchKind || (exports2.WatchKind = WatchKind = {}));
    var PublishDiagnosticsNotification;
    (function(PublishDiagnosticsNotification2) {
      PublishDiagnosticsNotification2.method = "textDocument/publishDiagnostics";
      PublishDiagnosticsNotification2.messageDirection = messages_1.MessageDirection.serverToClient;
      PublishDiagnosticsNotification2.type = new messages_1.ProtocolNotificationType(PublishDiagnosticsNotification2.method);
      PublishDiagnosticsNotification2.capabilities = messages_1.CM.create("textDocument.publishDiagnostics", void 0);
    })(PublishDiagnosticsNotification || (exports2.PublishDiagnosticsNotification = PublishDiagnosticsNotification = {}));
    var CompletionTriggerKind;
    (function(CompletionTriggerKind2) {
      CompletionTriggerKind2.Invoked = 1;
      CompletionTriggerKind2.TriggerCharacter = 2;
      CompletionTriggerKind2.TriggerForIncompleteCompletions = 3;
    })(CompletionTriggerKind || (exports2.CompletionTriggerKind = CompletionTriggerKind = {}));
    var CompletionRequest;
    (function(CompletionRequest2) {
      CompletionRequest2.method = "textDocument/completion";
      CompletionRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CompletionRequest2.type = new messages_1.ProtocolRequestType(CompletionRequest2.method);
      CompletionRequest2.capabilities = messages_1.CM.create("textDocument.completion", "completionProvider");
    })(CompletionRequest || (exports2.CompletionRequest = CompletionRequest = {}));
    var CompletionResolveRequest;
    (function(CompletionResolveRequest2) {
      CompletionResolveRequest2.method = "completionItem/resolve";
      CompletionResolveRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CompletionResolveRequest2.type = new messages_1.ProtocolRequestType(CompletionResolveRequest2.method);
      CompletionResolveRequest2.capabilities = messages_1.CM.create("textDocument.completion.completionItem.resolveSupport", "completionProvider.resolveProvider");
    })(CompletionResolveRequest || (exports2.CompletionResolveRequest = CompletionResolveRequest = {}));
    var HoverRequest;
    (function(HoverRequest2) {
      HoverRequest2.method = "textDocument/hover";
      HoverRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      HoverRequest2.type = new messages_1.ProtocolRequestType(HoverRequest2.method);
      HoverRequest2.capabilities = messages_1.CM.create("textDocument.hover", "hoverProvider");
    })(HoverRequest || (exports2.HoverRequest = HoverRequest = {}));
    var SignatureHelpTriggerKind;
    (function(SignatureHelpTriggerKind2) {
      SignatureHelpTriggerKind2.Invoked = 1;
      SignatureHelpTriggerKind2.TriggerCharacter = 2;
      SignatureHelpTriggerKind2.ContentChange = 3;
    })(SignatureHelpTriggerKind || (exports2.SignatureHelpTriggerKind = SignatureHelpTriggerKind = {}));
    var SignatureHelpRequest;
    (function(SignatureHelpRequest2) {
      SignatureHelpRequest2.method = "textDocument/signatureHelp";
      SignatureHelpRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      SignatureHelpRequest2.type = new messages_1.ProtocolRequestType(SignatureHelpRequest2.method);
      SignatureHelpRequest2.capabilities = messages_1.CM.create("textDocument.signatureHelp", "signatureHelpProvider");
    })(SignatureHelpRequest || (exports2.SignatureHelpRequest = SignatureHelpRequest = {}));
    var DefinitionRequest;
    (function(DefinitionRequest2) {
      DefinitionRequest2.method = "textDocument/definition";
      DefinitionRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DefinitionRequest2.type = new messages_1.ProtocolRequestType(DefinitionRequest2.method);
      DefinitionRequest2.capabilities = messages_1.CM.create("textDocument.definition", "definitionProvider");
    })(DefinitionRequest || (exports2.DefinitionRequest = DefinitionRequest = {}));
    var ReferencesRequest;
    (function(ReferencesRequest2) {
      ReferencesRequest2.method = "textDocument/references";
      ReferencesRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      ReferencesRequest2.type = new messages_1.ProtocolRequestType(ReferencesRequest2.method);
      ReferencesRequest2.capabilities = messages_1.CM.create("textDocument.references", "referencesProvider");
    })(ReferencesRequest || (exports2.ReferencesRequest = ReferencesRequest = {}));
    var DocumentHighlightRequest;
    (function(DocumentHighlightRequest2) {
      DocumentHighlightRequest2.method = "textDocument/documentHighlight";
      DocumentHighlightRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentHighlightRequest2.type = new messages_1.ProtocolRequestType(DocumentHighlightRequest2.method);
      DocumentHighlightRequest2.capabilities = messages_1.CM.create("textDocument.documentHighlight", "documentHighlightProvider");
    })(DocumentHighlightRequest || (exports2.DocumentHighlightRequest = DocumentHighlightRequest = {}));
    var DocumentSymbolRequest;
    (function(DocumentSymbolRequest2) {
      DocumentSymbolRequest2.method = "textDocument/documentSymbol";
      DocumentSymbolRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentSymbolRequest2.type = new messages_1.ProtocolRequestType(DocumentSymbolRequest2.method);
      DocumentSymbolRequest2.capabilities = messages_1.CM.create("textDocument.documentSymbol", "documentSymbolProvider");
    })(DocumentSymbolRequest || (exports2.DocumentSymbolRequest = DocumentSymbolRequest = {}));
    var CodeActionRequest;
    (function(CodeActionRequest2) {
      CodeActionRequest2.method = "textDocument/codeAction";
      CodeActionRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CodeActionRequest2.type = new messages_1.ProtocolRequestType(CodeActionRequest2.method);
      CodeActionRequest2.capabilities = messages_1.CM.create("textDocument.codeAction", "codeActionProvider");
    })(CodeActionRequest || (exports2.CodeActionRequest = CodeActionRequest = {}));
    var CodeActionResolveRequest;
    (function(CodeActionResolveRequest2) {
      CodeActionResolveRequest2.method = "codeAction/resolve";
      CodeActionResolveRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CodeActionResolveRequest2.type = new messages_1.ProtocolRequestType(CodeActionResolveRequest2.method);
      CodeActionResolveRequest2.capabilities = messages_1.CM.create("textDocument.codeAction.resolveSupport", "codeActionProvider.resolveProvider");
    })(CodeActionResolveRequest || (exports2.CodeActionResolveRequest = CodeActionResolveRequest = {}));
    var WorkspaceSymbolRequest;
    (function(WorkspaceSymbolRequest2) {
      WorkspaceSymbolRequest2.method = "workspace/symbol";
      WorkspaceSymbolRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      WorkspaceSymbolRequest2.type = new messages_1.ProtocolRequestType(WorkspaceSymbolRequest2.method);
      WorkspaceSymbolRequest2.capabilities = messages_1.CM.create("workspace.symbol", "workspaceSymbolProvider");
    })(WorkspaceSymbolRequest || (exports2.WorkspaceSymbolRequest = WorkspaceSymbolRequest = {}));
    var WorkspaceSymbolResolveRequest;
    (function(WorkspaceSymbolResolveRequest2) {
      WorkspaceSymbolResolveRequest2.method = "workspaceSymbol/resolve";
      WorkspaceSymbolResolveRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      WorkspaceSymbolResolveRequest2.type = new messages_1.ProtocolRequestType(WorkspaceSymbolResolveRequest2.method);
      WorkspaceSymbolResolveRequest2.capabilities = messages_1.CM.create("workspace.symbol.resolveSupport", "workspaceSymbolProvider.resolveProvider");
    })(WorkspaceSymbolResolveRequest || (exports2.WorkspaceSymbolResolveRequest = WorkspaceSymbolResolveRequest = {}));
    var CodeLensRequest;
    (function(CodeLensRequest2) {
      CodeLensRequest2.method = "textDocument/codeLens";
      CodeLensRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CodeLensRequest2.type = new messages_1.ProtocolRequestType(CodeLensRequest2.method);
      CodeLensRequest2.capabilities = messages_1.CM.create("textDocument.codeLens", "codeLensProvider");
    })(CodeLensRequest || (exports2.CodeLensRequest = CodeLensRequest = {}));
    var CodeLensResolveRequest;
    (function(CodeLensResolveRequest2) {
      CodeLensResolveRequest2.method = "codeLens/resolve";
      CodeLensResolveRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      CodeLensResolveRequest2.type = new messages_1.ProtocolRequestType(CodeLensResolveRequest2.method);
      CodeLensResolveRequest2.capabilities = messages_1.CM.create("textDocument.codeLens.resolveSupport", "codeLensProvider.resolveProvider");
    })(CodeLensResolveRequest || (exports2.CodeLensResolveRequest = CodeLensResolveRequest = {}));
    var CodeLensRefreshRequest;
    (function(CodeLensRefreshRequest2) {
      CodeLensRefreshRequest2.method = `workspace/codeLens/refresh`;
      CodeLensRefreshRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      CodeLensRefreshRequest2.type = new messages_1.ProtocolRequestType0(CodeLensRefreshRequest2.method);
      CodeLensRefreshRequest2.capabilities = messages_1.CM.create("workspace.codeLens", void 0);
    })(CodeLensRefreshRequest || (exports2.CodeLensRefreshRequest = CodeLensRefreshRequest = {}));
    var DocumentLinkRequest;
    (function(DocumentLinkRequest2) {
      DocumentLinkRequest2.method = "textDocument/documentLink";
      DocumentLinkRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentLinkRequest2.type = new messages_1.ProtocolRequestType(DocumentLinkRequest2.method);
      DocumentLinkRequest2.capabilities = messages_1.CM.create("textDocument.documentLink", "documentLinkProvider");
    })(DocumentLinkRequest || (exports2.DocumentLinkRequest = DocumentLinkRequest = {}));
    var DocumentLinkResolveRequest;
    (function(DocumentLinkResolveRequest2) {
      DocumentLinkResolveRequest2.method = "documentLink/resolve";
      DocumentLinkResolveRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentLinkResolveRequest2.type = new messages_1.ProtocolRequestType(DocumentLinkResolveRequest2.method);
      DocumentLinkResolveRequest2.capabilities = messages_1.CM.create("textDocument.documentLink", "documentLinkProvider.resolveProvider");
    })(DocumentLinkResolveRequest || (exports2.DocumentLinkResolveRequest = DocumentLinkResolveRequest = {}));
    var DocumentFormattingRequest;
    (function(DocumentFormattingRequest2) {
      DocumentFormattingRequest2.method = "textDocument/formatting";
      DocumentFormattingRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentFormattingRequest2.method);
      DocumentFormattingRequest2.capabilities = messages_1.CM.create("textDocument.formatting", "documentFormattingProvider");
    })(DocumentFormattingRequest || (exports2.DocumentFormattingRequest = DocumentFormattingRequest = {}));
    var DocumentRangeFormattingRequest;
    (function(DocumentRangeFormattingRequest2) {
      DocumentRangeFormattingRequest2.method = "textDocument/rangeFormatting";
      DocumentRangeFormattingRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentRangeFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentRangeFormattingRequest2.method);
      DocumentRangeFormattingRequest2.capabilities = messages_1.CM.create("textDocument.rangeFormatting", "documentRangeFormattingProvider");
    })(DocumentRangeFormattingRequest || (exports2.DocumentRangeFormattingRequest = DocumentRangeFormattingRequest = {}));
    var DocumentRangesFormattingRequest;
    (function(DocumentRangesFormattingRequest2) {
      DocumentRangesFormattingRequest2.method = "textDocument/rangesFormatting";
      DocumentRangesFormattingRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentRangesFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentRangesFormattingRequest2.method);
      DocumentRangesFormattingRequest2.capabilities = messages_1.CM.create("textDocument.rangeFormatting.rangesSupport", "documentRangeFormattingProvider.rangesSupport");
    })(DocumentRangesFormattingRequest || (exports2.DocumentRangesFormattingRequest = DocumentRangesFormattingRequest = {}));
    var DocumentOnTypeFormattingRequest;
    (function(DocumentOnTypeFormattingRequest2) {
      DocumentOnTypeFormattingRequest2.method = "textDocument/onTypeFormatting";
      DocumentOnTypeFormattingRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      DocumentOnTypeFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentOnTypeFormattingRequest2.method);
      DocumentOnTypeFormattingRequest2.capabilities = messages_1.CM.create("textDocument.onTypeFormatting", "documentOnTypeFormattingProvider");
    })(DocumentOnTypeFormattingRequest || (exports2.DocumentOnTypeFormattingRequest = DocumentOnTypeFormattingRequest = {}));
    var PrepareSupportDefaultBehavior;
    (function(PrepareSupportDefaultBehavior2) {
      PrepareSupportDefaultBehavior2.Identifier = 1;
    })(PrepareSupportDefaultBehavior || (exports2.PrepareSupportDefaultBehavior = PrepareSupportDefaultBehavior = {}));
    var RenameRequest;
    (function(RenameRequest2) {
      RenameRequest2.method = "textDocument/rename";
      RenameRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      RenameRequest2.type = new messages_1.ProtocolRequestType(RenameRequest2.method);
      RenameRequest2.capabilities = messages_1.CM.create("textDocument.rename", "renameProvider");
    })(RenameRequest || (exports2.RenameRequest = RenameRequest = {}));
    var PrepareRenameRequest;
    (function(PrepareRenameRequest2) {
      PrepareRenameRequest2.method = "textDocument/prepareRename";
      PrepareRenameRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      PrepareRenameRequest2.type = new messages_1.ProtocolRequestType(PrepareRenameRequest2.method);
      PrepareRenameRequest2.capabilities = messages_1.CM.create("textDocument.rename.prepareSupport", "renameProvider.prepareProvider");
    })(PrepareRenameRequest || (exports2.PrepareRenameRequest = PrepareRenameRequest = {}));
    var ExecuteCommandRequest;
    (function(ExecuteCommandRequest2) {
      ExecuteCommandRequest2.method = "workspace/executeCommand";
      ExecuteCommandRequest2.messageDirection = messages_1.MessageDirection.clientToServer;
      ExecuteCommandRequest2.type = new messages_1.ProtocolRequestType(ExecuteCommandRequest2.method);
      ExecuteCommandRequest2.capabilities = messages_1.CM.create("workspace.executeCommand", "executeCommandProvider");
    })(ExecuteCommandRequest || (exports2.ExecuteCommandRequest = ExecuteCommandRequest = {}));
    var ApplyWorkspaceEditRequest;
    (function(ApplyWorkspaceEditRequest2) {
      ApplyWorkspaceEditRequest2.method = "workspace/applyEdit";
      ApplyWorkspaceEditRequest2.messageDirection = messages_1.MessageDirection.serverToClient;
      ApplyWorkspaceEditRequest2.type = new messages_1.ProtocolRequestType("workspace/applyEdit");
      ApplyWorkspaceEditRequest2.capabilities = messages_1.CM.create("workspace.applyEdit", void 0);
    })(ApplyWorkspaceEditRequest || (exports2.ApplyWorkspaceEditRequest = ApplyWorkspaceEditRequest = {}));
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/connection.js
var require_connection2 = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/connection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createProtocolConnection = createProtocolConnection;
    var vscode_jsonrpc_1 = require_api();
    function createProtocolConnection(input, output, logger, options) {
      if (vscode_jsonrpc_1.ConnectionStrategy.is(options)) {
        options = { connectionStrategy: options };
      }
      return (0, vscode_jsonrpc_1.createMessageConnection)(input, output, logger, options);
    }
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/common/api.js
var require_api2 = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/common/api.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LSPErrorCodes = exports2.createProtocolConnection = void 0;
    __exportStar(require_api(), exports2);
    __exportStar((init_main(), __toCommonJS(main_exports)), exports2);
    __exportStar(require_messages2(), exports2);
    __exportStar(require_protocol(), exports2);
    var connection_1 = require_connection2();
    Object.defineProperty(exports2, "createProtocolConnection", { enumerable: true, get: function() {
      return connection_1.createProtocolConnection;
    } });
    var LSPErrorCodes;
    (function(LSPErrorCodes2) {
      LSPErrorCodes2.lspReservedErrorRangeStart = -32899;
      LSPErrorCodes2.RequestFailed = -32803;
      LSPErrorCodes2.ServerCancelled = -32802;
      LSPErrorCodes2.ContentModified = -32801;
      LSPErrorCodes2.RequestCancelled = -32800;
      LSPErrorCodes2.lspReservedErrorRangeEnd = -32800;
    })(LSPErrorCodes || (exports2.LSPErrorCodes = LSPErrorCodes = {}));
  }
});

// ../node_modules/vscode-languageserver/lib/common/utils/uuid.js
var require_uuid = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/utils/uuid.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.empty = void 0;
    exports2.v4 = v4;
    exports2.isUUID = isUUID;
    exports2.parse = parse;
    exports2.generateUuid = generateUuid;
    var ValueUUID = class {
      _value;
      constructor(_value) {
        this._value = _value;
      }
      asHex() {
        return this._value;
      }
      equals(other) {
        return this.asHex() === other.asHex();
      }
    };
    var V4UUID = class _V4UUID extends ValueUUID {
      static _chars = ["0", "1", "2", "3", "4", "5", "6", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
      static _timeHighBits = ["8", "9", "a", "b"];
      static _oneOf(array) {
        return array[Math.floor(array.length * Math.random())];
      }
      static _randomHex() {
        return _V4UUID._oneOf(_V4UUID._chars);
      }
      constructor() {
        super([
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          "-",
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          "-",
          "4",
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          "-",
          _V4UUID._oneOf(_V4UUID._timeHighBits),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          "-",
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex(),
          _V4UUID._randomHex()
        ].join(""));
      }
    };
    exports2.empty = new ValueUUID("00000000-0000-0000-0000-000000000000");
    function v4() {
      return new V4UUID();
    }
    var _UUIDPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    function isUUID(value) {
      return _UUIDPattern.test(value);
    }
    function parse(value) {
      if (!isUUID(value)) {
        throw new Error("invalid uuid");
      }
      return new ValueUUID(value);
    }
    function generateUuid() {
      return v4().asHex();
    }
  }
});

// ../node_modules/vscode-languageserver/lib/common/progress.js
var require_progress = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/progress.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProgressFeature = exports2.WorkDoneProgressReporter = void 0;
    exports2.attachWorkDone = attachWorkDone;
    exports2.attachPartialResult = attachPartialResult;
    var vscode_languageserver_protocol_1 = require_api2();
    var uuid_1 = require_uuid();
    var WorkDoneProgressReporter;
    (function(WorkDoneProgressReporter2) {
      function isNullInstance(reporter) {
        return reporter instanceof NullProgressReporter;
      }
      WorkDoneProgressReporter2.isNullInstance = isNullInstance;
    })(WorkDoneProgressReporter || (exports2.WorkDoneProgressReporter = WorkDoneProgressReporter = {}));
    var WorkDoneProgressReporterImpl = class _WorkDoneProgressReporterImpl {
      _connection;
      _token;
      static Instances = /* @__PURE__ */ new Map();
      constructor(_connection, _token) {
        this._connection = _connection;
        this._token = _token;
        _WorkDoneProgressReporterImpl.Instances.set(this._token, this);
      }
      begin(title, percentage, message, cancellable) {
        const param = {
          kind: "begin",
          title,
          message,
          cancellable
        };
        if (typeof percentage === "number") {
          param.percentage = Math.round(percentage);
        }
        this._connection.sendProgress(vscode_languageserver_protocol_1.WorkDoneProgress.type, this._token, param);
      }
      report(arg0, arg1) {
        const param = {
          kind: "report"
        };
        if (typeof arg0 === "number") {
          param.percentage = Math.round(arg0);
          if (arg1 !== void 0) {
            param.message = arg1;
          }
        } else {
          param.message = arg0;
        }
        this._connection.sendProgress(vscode_languageserver_protocol_1.WorkDoneProgress.type, this._token, param);
      }
      done() {
        _WorkDoneProgressReporterImpl.Instances.delete(this._token);
        this._connection.sendProgress(vscode_languageserver_protocol_1.WorkDoneProgress.type, this._token, { kind: "end" });
      }
    };
    var WorkDoneProgressServerReporterImpl = class extends WorkDoneProgressReporterImpl {
      _source;
      constructor(connection, token) {
        super(connection, token);
        this._source = new vscode_languageserver_protocol_1.CancellationTokenSource();
      }
      get token() {
        return this._source.token;
      }
      done() {
        this._source.dispose();
        super.done();
      }
      cancel() {
        this._source.cancel();
      }
    };
    var NullProgressReporter = class {
      constructor() {
      }
      begin() {
      }
      report() {
      }
      done() {
      }
    };
    var NullProgressServerReporter = class extends NullProgressReporter {
      _source;
      constructor() {
        super();
        this._source = new vscode_languageserver_protocol_1.CancellationTokenSource();
      }
      get token() {
        return this._source.token;
      }
      done() {
        this._source.dispose();
      }
      cancel() {
        this._source.cancel();
      }
    };
    function attachWorkDone(connection, params) {
      if (params === void 0 || params.workDoneToken === void 0) {
        return new NullProgressReporter();
      }
      const token = params.workDoneToken;
      delete params.workDoneToken;
      return new WorkDoneProgressReporterImpl(connection, token);
    }
    var ProgressFeature = (Base) => {
      return class extends Base {
        _progressSupported;
        constructor() {
          super();
          this._progressSupported = false;
        }
        initialize(capabilities) {
          super.initialize(capabilities);
          if (capabilities?.window?.workDoneProgress === true) {
            this._progressSupported = true;
            this.connection.onNotification(vscode_languageserver_protocol_1.WorkDoneProgressCancelNotification.type, (params) => {
              const progress = WorkDoneProgressReporterImpl.Instances.get(params.token);
              if (progress instanceof WorkDoneProgressServerReporterImpl || progress instanceof NullProgressServerReporter) {
                progress.cancel();
              }
            });
          }
        }
        attachWorkDoneProgress(token) {
          if (token === void 0) {
            return new NullProgressReporter();
          } else {
            return new WorkDoneProgressReporterImpl(this.connection, token);
          }
        }
        createWorkDoneProgress() {
          if (this._progressSupported) {
            const token = (0, uuid_1.generateUuid)();
            return this.connection.sendRequest(vscode_languageserver_protocol_1.WorkDoneProgressCreateRequest.type, { token }).then(() => {
              const result = new WorkDoneProgressServerReporterImpl(this.connection, token);
              return result;
            });
          } else {
            return Promise.resolve(new NullProgressServerReporter());
          }
        }
      };
    };
    exports2.ProgressFeature = ProgressFeature;
    var ResultProgress;
    (function(ResultProgress2) {
      ResultProgress2.type = new vscode_languageserver_protocol_1.ProgressType();
    })(ResultProgress || (ResultProgress = {}));
    var ResultProgressReporterImpl = class {
      _connection;
      _token;
      constructor(_connection, _token) {
        this._connection = _connection;
        this._token = _token;
      }
      report(data) {
        this._connection.sendProgress(ResultProgress.type, this._token, data);
      }
    };
    function attachPartialResult(connection, params) {
      if (params === void 0 || params.partialResultToken === void 0) {
        return void 0;
      }
      const token = params.partialResultToken;
      delete params.partialResultToken;
      return new ResultProgressReporterImpl(connection, token);
    }
  }
});

// ../node_modules/vscode-languageserver/lib/common/configuration.js
var require_configuration = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/configuration.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ConfigurationFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var Is2 = __importStar(require_is());
    var ConfigurationFeature = (Base) => {
      return class extends Base {
        getConfiguration(arg) {
          if (!arg) {
            return this._getConfiguration({});
          } else if (Is2.string(arg)) {
            return this._getConfiguration({ section: arg });
          } else {
            return this._getConfiguration(arg);
          }
        }
        _getConfiguration(arg) {
          const params = {
            items: Array.isArray(arg) ? arg : [arg]
          };
          return this.connection.sendRequest(vscode_languageserver_protocol_1.ConfigurationRequest.type, params).then((result) => {
            if (Array.isArray(result)) {
              return Array.isArray(arg) ? result : result[0];
            } else {
              return Array.isArray(arg) ? [] : null;
            }
          });
        }
      };
    };
    exports2.ConfigurationFeature = ConfigurationFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/workspaceFolder.js
var require_workspaceFolder = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/workspaceFolder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WorkspaceFoldersFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var WorkspaceFoldersFeature = (Base) => {
      return class extends Base {
        _onDidChangeWorkspaceFolders;
        _unregistration;
        _notificationIsAutoRegistered;
        constructor() {
          super();
          this._notificationIsAutoRegistered = false;
        }
        initialize(capabilities) {
          super.initialize(capabilities);
          const workspaceCapabilities = capabilities.workspace;
          if (workspaceCapabilities && workspaceCapabilities.workspaceFolders) {
            this._onDidChangeWorkspaceFolders = new vscode_languageserver_protocol_1.Emitter();
            this.connection.onNotification(vscode_languageserver_protocol_1.DidChangeWorkspaceFoldersNotification.type, (params) => {
              this._onDidChangeWorkspaceFolders.fire(params.event);
            });
          }
        }
        fillServerCapabilities(capabilities) {
          super.fillServerCapabilities(capabilities);
          const changeNotifications = capabilities.workspace?.workspaceFolders?.changeNotifications;
          this._notificationIsAutoRegistered = changeNotifications === true || typeof changeNotifications === "string";
        }
        getWorkspaceFolders() {
          return this.connection.sendRequest(vscode_languageserver_protocol_1.WorkspaceFoldersRequest.type);
        }
        get onDidChangeWorkspaceFolders() {
          if (!this._onDidChangeWorkspaceFolders) {
            throw new Error("Client doesn't support sending workspace folder change events.");
          }
          if (!this._notificationIsAutoRegistered && !this._unregistration) {
            this._unregistration = this.connection.client.register(vscode_languageserver_protocol_1.DidChangeWorkspaceFoldersNotification.type);
          }
          return this._onDidChangeWorkspaceFolders.event;
        }
      };
    };
    exports2.WorkspaceFoldersFeature = WorkspaceFoldersFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/callHierarchy.js
var require_callHierarchy = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/callHierarchy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CallHierarchyFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var CallHierarchyFeature = (Base) => {
      return class extends Base {
        get callHierarchy() {
          return {
            onPrepare: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.CallHierarchyPrepareRequest.type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), void 0);
              });
            },
            onIncomingCalls: (handler) => {
              const type = vscode_languageserver_protocol_1.CallHierarchyIncomingCallsRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            },
            onOutgoingCalls: (handler) => {
              const type = vscode_languageserver_protocol_1.CallHierarchyOutgoingCallsRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            }
          };
        }
      };
    };
    exports2.CallHierarchyFeature = CallHierarchyFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/semanticTokens.js
var require_semanticTokens = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/semanticTokens.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SemanticTokensBuilder = exports2.SemanticTokensDiff = exports2.SemanticTokensFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var SemanticTokensFeature = (Base) => {
      return class extends Base {
        get semanticTokens() {
          return {
            refresh: () => {
              return this.connection.sendRequest(vscode_languageserver_protocol_1.SemanticTokensRefreshRequest.type);
            },
            on: (handler) => {
              const type = vscode_languageserver_protocol_1.SemanticTokensRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            },
            onDelta: (handler) => {
              const type = vscode_languageserver_protocol_1.SemanticTokensDeltaRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            },
            onRange: (handler) => {
              const type = vscode_languageserver_protocol_1.SemanticTokensRangeRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            }
          };
        }
      };
    };
    exports2.SemanticTokensFeature = SemanticTokensFeature;
    var SemanticTokensDiff = class {
      originalSequence;
      modifiedSequence;
      constructor(originalSequence, modifiedSequence) {
        this.originalSequence = originalSequence;
        this.modifiedSequence = modifiedSequence;
      }
      computeDiff() {
        const originalLength = this.originalSequence.length;
        const modifiedLength = this.modifiedSequence.length;
        let startIndex = 0;
        while (startIndex < modifiedLength && startIndex < originalLength && this.originalSequence[startIndex] === this.modifiedSequence[startIndex]) {
          startIndex++;
        }
        if (startIndex < modifiedLength && startIndex < originalLength) {
          let originalEndIndex = originalLength - 1;
          let modifiedEndIndex = modifiedLength - 1;
          while (originalEndIndex >= startIndex && modifiedEndIndex >= startIndex && this.originalSequence[originalEndIndex] === this.modifiedSequence[modifiedEndIndex]) {
            originalEndIndex--;
            modifiedEndIndex--;
          }
          if (originalEndIndex < startIndex || modifiedEndIndex < startIndex) {
            originalEndIndex++;
            modifiedEndIndex++;
          }
          const deleteCount = originalEndIndex - startIndex + 1;
          const newData = this.modifiedSequence.slice(startIndex, modifiedEndIndex + 1);
          if (newData.length === 1 && newData[0] === this.originalSequence[originalEndIndex]) {
            return [
              { start: startIndex, deleteCount: deleteCount - 1 }
            ];
          } else {
            return [
              { start: startIndex, deleteCount, data: newData }
            ];
          }
        } else if (startIndex < modifiedLength) {
          return [
            { start: startIndex, deleteCount: 0, data: this.modifiedSequence.slice(startIndex) }
          ];
        } else if (startIndex < originalLength) {
          return [
            { start: startIndex, deleteCount: originalLength - startIndex }
          ];
        } else {
          return [];
        }
      }
    };
    exports2.SemanticTokensDiff = SemanticTokensDiff;
    var SemanticTokensBuilder = class _SemanticTokensBuilder {
      _id;
      _prevLine;
      _prevChar;
      _dataIsSortedAndDeltaEncoded;
      _data;
      _dataNonDelta;
      _dataLen;
      _prevData;
      constructor() {
        this._prevData = void 0;
        this.initialize();
      }
      initialize() {
        this._id = Date.now();
        this._prevLine = 0;
        this._prevChar = 0;
        this._data = [];
        this._dataNonDelta = [];
        this._dataLen = 0;
        this._dataIsSortedAndDeltaEncoded = true;
      }
      push(line2, char, length, tokenType, tokenModifiers) {
        if (this._dataIsSortedAndDeltaEncoded && (line2 < this._prevLine || line2 === this._prevLine && char < this._prevChar)) {
          this._dataIsSortedAndDeltaEncoded = false;
          this._dataNonDelta = _SemanticTokensBuilder._deltaDecode(this._data);
        }
        let pushLine = line2;
        let pushChar = char;
        if (this._dataIsSortedAndDeltaEncoded && this._dataLen > 0) {
          pushLine -= this._prevLine;
          if (pushLine === 0) {
            pushChar -= this._prevChar;
          }
        }
        const dataSource = this._dataIsSortedAndDeltaEncoded ? this._data : this._dataNonDelta;
        dataSource[this._dataLen++] = pushLine;
        dataSource[this._dataLen++] = pushChar;
        dataSource[this._dataLen++] = length;
        dataSource[this._dataLen++] = tokenType;
        dataSource[this._dataLen++] = tokenModifiers;
        this._prevLine = line2;
        this._prevChar = char;
      }
      get id() {
        return this._id.toString();
      }
      static _deltaDecode(data) {
        const tokenCount = data.length / 5 | 0;
        let prevLine = 0;
        let prevChar = 0;
        const result = [];
        for (let i2 = 0; i2 < tokenCount; i2++) {
          const dstOffset = 5 * i2;
          let line2 = data[dstOffset];
          let char = data[dstOffset + 1];
          if (line2 === 0) {
            line2 = prevLine;
            char += prevChar;
          } else {
            line2 += prevLine;
          }
          const length = data[dstOffset + 2];
          const tokenType = data[dstOffset + 3];
          const tokenModifiers = data[dstOffset + 4];
          result[dstOffset + 0] = line2;
          result[dstOffset + 1] = char;
          result[dstOffset + 2] = length;
          result[dstOffset + 3] = tokenType;
          result[dstOffset + 4] = tokenModifiers;
          prevLine = line2;
          prevChar = char;
        }
        return result;
      }
      static _sortAndDeltaEncode(data) {
        const pos = [];
        const tokenCount = data.length / 5 | 0;
        for (let i2 = 0; i2 < tokenCount; i2++) {
          pos[i2] = i2;
        }
        pos.sort((a2, b2) => {
          const aLine = data[5 * a2];
          const bLine = data[5 * b2];
          if (aLine === bLine) {
            const aChar = data[5 * a2 + 1];
            const bChar = data[5 * b2 + 1];
            return aChar - bChar;
          }
          return aLine - bLine;
        });
        const result = [];
        let prevLine = 0;
        let prevChar = 0;
        for (let i2 = 0; i2 < tokenCount; i2++) {
          const srcOffset = 5 * pos[i2];
          const line2 = data[srcOffset + 0];
          const char = data[srcOffset + 1];
          const length = data[srcOffset + 2];
          const tokenType = data[srcOffset + 3];
          const tokenModifiers = data[srcOffset + 4];
          const pushLine = line2 - prevLine;
          const pushChar = pushLine === 0 ? char - prevChar : char;
          const dstOffset = 5 * i2;
          result[dstOffset + 0] = pushLine;
          result[dstOffset + 1] = pushChar;
          result[dstOffset + 2] = length;
          result[dstOffset + 3] = tokenType;
          result[dstOffset + 4] = tokenModifiers;
          prevLine = line2;
          prevChar = char;
        }
        return result;
      }
      getFinalDataDelta() {
        if (this._dataIsSortedAndDeltaEncoded) {
          return this._data;
        } else {
          return _SemanticTokensBuilder._sortAndDeltaEncode(this._dataNonDelta);
        }
      }
      previousResult(id) {
        if (this.id === id) {
          this._prevData = this.getFinalDataDelta();
        } else {
          this._prevData = void 0;
        }
        this.initialize();
      }
      build() {
        this._prevData = void 0;
        return {
          resultId: this.id,
          data: this.getFinalDataDelta()
        };
      }
      canBuildEdits() {
        return this._prevData !== void 0;
      }
      buildEdits() {
        if (this._prevData !== void 0) {
          return {
            resultId: this.id,
            edits: new SemanticTokensDiff(this._prevData, this.getFinalDataDelta()).computeDiff()
          };
        } else {
          return this.build();
        }
      }
    };
    exports2.SemanticTokensBuilder = SemanticTokensBuilder;
  }
});

// ../node_modules/vscode-languageserver/lib/common/showDocument.js
var require_showDocument = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/showDocument.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ShowDocumentFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var ShowDocumentFeature = (Base) => {
      return class extends Base {
        showDocument(params) {
          return this.connection.sendRequest(vscode_languageserver_protocol_1.ShowDocumentRequest.type, params);
        }
      };
    };
    exports2.ShowDocumentFeature = ShowDocumentFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/fileOperations.js
var require_fileOperations = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/fileOperations.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FileOperationsFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var FileOperationsFeature = (Base) => {
      return class extends Base {
        onDidCreateFiles(handler) {
          return this.connection.onNotification(vscode_languageserver_protocol_1.DidCreateFilesNotification.type, (params) => {
            return handler(params);
          });
        }
        onDidRenameFiles(handler) {
          return this.connection.onNotification(vscode_languageserver_protocol_1.DidRenameFilesNotification.type, (params) => {
            return handler(params);
          });
        }
        onDidDeleteFiles(handler) {
          return this.connection.onNotification(vscode_languageserver_protocol_1.DidDeleteFilesNotification.type, (params) => {
            return handler(params);
          });
        }
        onWillCreateFiles(handler) {
          return this.connection.onRequest(vscode_languageserver_protocol_1.WillCreateFilesRequest.type, (params, cancel) => {
            return handler(params, cancel);
          });
        }
        onWillRenameFiles(handler) {
          return this.connection.onRequest(vscode_languageserver_protocol_1.WillRenameFilesRequest.type, (params, cancel) => {
            return handler(params, cancel);
          });
        }
        onWillDeleteFiles(handler) {
          return this.connection.onRequest(vscode_languageserver_protocol_1.WillDeleteFilesRequest.type, (params, cancel) => {
            return handler(params, cancel);
          });
        }
      };
    };
    exports2.FileOperationsFeature = FileOperationsFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/linkedEditingRange.js
var require_linkedEditingRange = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/linkedEditingRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LinkedEditingRangeFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var LinkedEditingRangeFeature = (Base) => {
      return class extends Base {
        onLinkedEditingRange(handler) {
          return this.connection.onRequest(vscode_languageserver_protocol_1.LinkedEditingRangeRequest.type, (params, cancel) => {
            return handler(params, cancel, this.attachWorkDoneProgress(params), void 0);
          });
        }
      };
    };
    exports2.LinkedEditingRangeFeature = LinkedEditingRangeFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/typeHierarchy.js
var require_typeHierarchy = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/typeHierarchy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TypeHierarchyFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var TypeHierarchyFeature = (Base) => {
      return class extends Base {
        get typeHierarchy() {
          return {
            onPrepare: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.TypeHierarchyPrepareRequest.type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), void 0);
              });
            },
            onSupertypes: (handler) => {
              const type = vscode_languageserver_protocol_1.TypeHierarchySupertypesRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            },
            onSubtypes: (handler) => {
              const type = vscode_languageserver_protocol_1.TypeHierarchySubtypesRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            }
          };
        }
      };
    };
    exports2.TypeHierarchyFeature = TypeHierarchyFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/inlineValue.js
var require_inlineValue = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/inlineValue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InlineValueFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var InlineValueFeature = (Base) => {
      return class extends Base {
        get inlineValue() {
          return {
            refresh: () => {
              return this.connection.sendRequest(vscode_languageserver_protocol_1.InlineValueRefreshRequest.type);
            },
            on: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.InlineValueRequest.type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params));
              });
            }
          };
        }
      };
    };
    exports2.InlineValueFeature = InlineValueFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/foldingRange.js
var require_foldingRange = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/foldingRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FoldingRangeFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var FoldingRangeFeature = (Base) => {
      return class extends Base {
        get foldingRange() {
          return {
            refresh: () => {
              return this.connection.sendRequest(vscode_languageserver_protocol_1.FoldingRangeRefreshRequest.type);
            },
            on: (handler) => {
              const type = vscode_languageserver_protocol_1.FoldingRangeRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            }
          };
        }
      };
    };
    exports2.FoldingRangeFeature = FoldingRangeFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/inlayHint.js
var require_inlayHint = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/inlayHint.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InlayHintFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var InlayHintFeature = (Base) => {
      return class extends Base {
        get inlayHint() {
          return {
            refresh: () => {
              return this.connection.sendRequest(vscode_languageserver_protocol_1.InlayHintRefreshRequest.type);
            },
            on: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.InlayHintRequest.type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params));
              });
            },
            resolve: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.InlayHintResolveRequest.type, (params, cancel) => {
                return handler(params, cancel);
              });
            }
          };
        }
      };
    };
    exports2.InlayHintFeature = InlayHintFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/diagnostic.js
var require_diagnostic = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/diagnostic.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DiagnosticFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var DiagnosticFeature = (Base) => {
      return class extends Base {
        get diagnostics() {
          return {
            refresh: () => {
              return this.connection.sendRequest(vscode_languageserver_protocol_1.DiagnosticRefreshRequest.type);
            },
            on: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.DocumentDiagnosticRequest.type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(vscode_languageserver_protocol_1.DocumentDiagnosticRequest.partialResult, params));
              });
            },
            onWorkspace: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.WorkspaceDiagnosticRequest.type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(vscode_languageserver_protocol_1.WorkspaceDiagnosticRequest.partialResult, params));
              });
            }
          };
        }
      };
    };
    exports2.DiagnosticFeature = DiagnosticFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/textDocuments.js
var require_textDocuments = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/textDocuments.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TextDocuments = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var TextDocuments3 = class {
      _configuration;
      _syncedDocuments;
      _onDidChangeContent;
      _onDidOpen;
      _onDidClose;
      _onDidSave;
      _onWillSave;
      _willSaveWaitUntil;
      /**
       * Create a new text document manager.
       */
      constructor(configuration) {
        this._configuration = configuration;
        this._syncedDocuments = /* @__PURE__ */ new Map();
        this._onDidChangeContent = new vscode_languageserver_protocol_1.Emitter();
        this._onDidOpen = new vscode_languageserver_protocol_1.Emitter();
        this._onDidClose = new vscode_languageserver_protocol_1.Emitter();
        this._onDidSave = new vscode_languageserver_protocol_1.Emitter();
        this._onWillSave = new vscode_languageserver_protocol_1.Emitter();
      }
      /**
       * An event that fires when a text document managed by this manager
       * has been opened.
       */
      get onDidOpen() {
        return this._onDidOpen.event;
      }
      /**
       * An event that fires when a text document managed by this manager
       * has been opened or the content changes.
       */
      get onDidChangeContent() {
        return this._onDidChangeContent.event;
      }
      /**
       * An event that fires when a text document managed by this manager
       * will be saved.
       */
      get onWillSave() {
        return this._onWillSave.event;
      }
      /**
       * Sets a handler that will be called if a participant wants to provide
       * edits during a text document save.
       */
      onWillSaveWaitUntil(handler) {
        this._willSaveWaitUntil = handler;
      }
      /**
       * An event that fires when a text document managed by this manager
       * has been saved.
       */
      get onDidSave() {
        return this._onDidSave.event;
      }
      /**
       * An event that fires when a text document managed by this manager
       * has been closed.
       */
      get onDidClose() {
        return this._onDidClose.event;
      }
      /**
       * Returns the document for the given URI. Returns undefined if
       * the document is not managed by this instance.
       *
       * @param uri The text document's URI to retrieve.
       * @return the text document or `undefined`.
       */
      get(uri) {
        return this._syncedDocuments.get(uri);
      }
      /**
       * Returns all text documents managed by this instance.
       *
       * @return all text documents.
       */
      all() {
        return Array.from(this._syncedDocuments.values());
      }
      /**
       * Returns the URIs of all text documents managed by this instance.
       *
       * @return the URI's of all text documents.
       */
      keys() {
        return Array.from(this._syncedDocuments.keys());
      }
      /**
       * Listens for `low level` notification on the given connection to
       * update the text documents managed by this instance.
       *
       * Please note that the connection only provides handlers not an event model. Therefore
       * listening on a connection will overwrite the following handlers on a connection:
       * `onDidOpenTextDocument`, `onDidChangeTextDocument`, `onDidCloseTextDocument`,
       * `onWillSaveTextDocument`, `onWillSaveTextDocumentWaitUntil` and `onDidSaveTextDocument`.
       *
       * Use the corresponding events on the TextDocuments instance instead.
       *
       * @param connection The connection to listen on.
       */
      listen(connection) {
        connection.__textDocumentSync = vscode_languageserver_protocol_1.TextDocumentSyncKind.Incremental;
        const disposables = [];
        disposables.push(connection.onDidOpenTextDocument((event) => {
          const td = event.textDocument;
          const document = this._configuration.create(td.uri, td.languageId, td.version, td.text);
          this._syncedDocuments.set(td.uri, document);
          const toFire = Object.freeze({ document });
          this._onDidOpen.fire(toFire);
          this._onDidChangeContent.fire(toFire);
        }));
        disposables.push(connection.onDidChangeTextDocument((event) => {
          const td = event.textDocument;
          const changes = event.contentChanges;
          if (changes.length === 0) {
            return;
          }
          const { version } = td;
          if (version === null || version === void 0) {
            throw new Error(`Received document change event for ${td.uri} without valid version identifier`);
          }
          let syncedDocument = this._syncedDocuments.get(td.uri);
          if (syncedDocument !== void 0) {
            syncedDocument = this._configuration.update(syncedDocument, changes, version);
            this._syncedDocuments.set(td.uri, syncedDocument);
            this._onDidChangeContent.fire(Object.freeze({ document: syncedDocument }));
          }
        }));
        disposables.push(connection.onDidCloseTextDocument((event) => {
          const syncedDocument = this._syncedDocuments.get(event.textDocument.uri);
          if (syncedDocument !== void 0) {
            this._syncedDocuments.delete(event.textDocument.uri);
            this._onDidClose.fire(Object.freeze({ document: syncedDocument }));
          }
        }));
        disposables.push(connection.onWillSaveTextDocument((event) => {
          const syncedDocument = this._syncedDocuments.get(event.textDocument.uri);
          if (syncedDocument !== void 0) {
            this._onWillSave.fire(Object.freeze({ document: syncedDocument, reason: event.reason }));
          }
        }));
        disposables.push(connection.onWillSaveTextDocumentWaitUntil((event, token) => {
          const syncedDocument = this._syncedDocuments.get(event.textDocument.uri);
          if (syncedDocument !== void 0 && this._willSaveWaitUntil) {
            return this._willSaveWaitUntil(Object.freeze({ document: syncedDocument, reason: event.reason }), token);
          } else {
            return [];
          }
        }));
        disposables.push(connection.onDidSaveTextDocument((event) => {
          const syncedDocument = this._syncedDocuments.get(event.textDocument.uri);
          if (syncedDocument !== void 0) {
            this._onDidSave.fire(Object.freeze({ document: syncedDocument }));
          }
        }));
        return vscode_languageserver_protocol_1.Disposable.create(() => {
          disposables.forEach((disposable) => disposable.dispose());
        });
      }
    };
    exports2.TextDocuments = TextDocuments3;
  }
});

// ../node_modules/vscode-languageserver/lib/common/notebook.js
var require_notebook = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/notebook.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NotebookDocuments = exports2.NotebookSyncFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var textDocuments_1 = require_textDocuments();
    var NotebookSyncFeature = (Base) => {
      return class extends Base {
        get synchronization() {
          return {
            onDidOpenNotebookDocument: (handler) => {
              return this.connection.onNotification(vscode_languageserver_protocol_1.DidOpenNotebookDocumentNotification.type, (params) => {
                return handler(params);
              });
            },
            onDidChangeNotebookDocument: (handler) => {
              return this.connection.onNotification(vscode_languageserver_protocol_1.DidChangeNotebookDocumentNotification.type, (params) => {
                return handler(params);
              });
            },
            onDidSaveNotebookDocument: (handler) => {
              return this.connection.onNotification(vscode_languageserver_protocol_1.DidSaveNotebookDocumentNotification.type, (params) => {
                return handler(params);
              });
            },
            onDidCloseNotebookDocument: (handler) => {
              return this.connection.onNotification(vscode_languageserver_protocol_1.DidCloseNotebookDocumentNotification.type, (params) => {
                return handler(params);
              });
            }
          };
        }
      };
    };
    exports2.NotebookSyncFeature = NotebookSyncFeature;
    var CellTextDocumentConnection = class _CellTextDocumentConnection {
      static NULL_DISPOSE = Object.freeze({ dispose: () => {
      } });
      openHandler;
      changeHandler;
      closeHandler;
      onDidOpenTextDocument(handler) {
        this.openHandler = handler;
        return vscode_languageserver_protocol_1.Disposable.create(() => {
          this.openHandler = void 0;
        });
      }
      openTextDocument(params) {
        return this.openHandler && this.openHandler(params);
      }
      onDidChangeTextDocument(handler) {
        this.changeHandler = handler;
        return vscode_languageserver_protocol_1.Disposable.create(() => {
          this.changeHandler = handler;
        });
      }
      changeTextDocument(params) {
        return this.changeHandler && this.changeHandler(params);
      }
      onDidCloseTextDocument(handler) {
        this.closeHandler = handler;
        return vscode_languageserver_protocol_1.Disposable.create(() => {
          this.closeHandler = void 0;
        });
      }
      closeTextDocument(params) {
        return this.closeHandler && this.closeHandler(params);
      }
      onWillSaveTextDocument() {
        return _CellTextDocumentConnection.NULL_DISPOSE;
      }
      onWillSaveTextDocumentWaitUntil() {
        return _CellTextDocumentConnection.NULL_DISPOSE;
      }
      onDidSaveTextDocument() {
        return _CellTextDocumentConnection.NULL_DISPOSE;
      }
    };
    var NotebookDocuments = class {
      notebookDocuments;
      notebookCellMap;
      _onDidOpen;
      _onDidSave;
      _onDidChange;
      _onDidClose;
      _cellTextDocuments;
      constructor(configurationOrTextDocuments) {
        if (configurationOrTextDocuments instanceof textDocuments_1.TextDocuments) {
          this._cellTextDocuments = configurationOrTextDocuments;
        } else {
          this._cellTextDocuments = new textDocuments_1.TextDocuments(configurationOrTextDocuments);
        }
        this.notebookDocuments = /* @__PURE__ */ new Map();
        this.notebookCellMap = /* @__PURE__ */ new Map();
        this._onDidOpen = new vscode_languageserver_protocol_1.Emitter();
        this._onDidChange = new vscode_languageserver_protocol_1.Emitter();
        this._onDidSave = new vscode_languageserver_protocol_1.Emitter();
        this._onDidClose = new vscode_languageserver_protocol_1.Emitter();
      }
      get cellTextDocuments() {
        return this._cellTextDocuments;
      }
      getCellTextDocument(cell) {
        return this._cellTextDocuments.get(cell.document);
      }
      getNotebookDocument(uri) {
        return this.notebookDocuments.get(uri);
      }
      getNotebookCell(uri) {
        const value = this.notebookCellMap.get(uri);
        return value && value[0];
      }
      findNotebookDocumentForCell(cell) {
        const key = typeof cell === "string" ? cell : cell.document;
        const value = this.notebookCellMap.get(key);
        return value && value[1];
      }
      get onDidOpen() {
        return this._onDidOpen.event;
      }
      get onDidSave() {
        return this._onDidSave.event;
      }
      get onDidChange() {
        return this._onDidChange.event;
      }
      get onDidClose() {
        return this._onDidClose.event;
      }
      /**
       * Listens for `low level` notification on the given connection to
       * update the notebook documents managed by this instance.
       *
       * Please note that the connection only provides handlers not an event model. Therefore
       * listening on a connection will overwrite the following handlers on a connection:
       * `onDidOpenNotebookDocument`, `onDidChangeNotebookDocument`, `onDidSaveNotebookDocument`,
       *  and `onDidCloseNotebookDocument`.
       *
       * @param connection The connection to listen on.
       */
      listen(connection) {
        const cellTextDocumentConnection = new CellTextDocumentConnection();
        const disposables = [];
        disposables.push(this.cellTextDocuments.listen(cellTextDocumentConnection));
        disposables.push(connection.notebooks.synchronization.onDidOpenNotebookDocument(async (params) => {
          this.notebookDocuments.set(params.notebookDocument.uri, params.notebookDocument);
          for (const cellTextDocument of params.cellTextDocuments) {
            await cellTextDocumentConnection.openTextDocument({ textDocument: cellTextDocument });
          }
          this.updateCellMap(params.notebookDocument);
          this._onDidOpen.fire(params.notebookDocument);
        }));
        disposables.push(connection.notebooks.synchronization.onDidChangeNotebookDocument(async (params) => {
          const notebookDocument = this.notebookDocuments.get(params.notebookDocument.uri);
          if (notebookDocument === void 0) {
            return;
          }
          notebookDocument.version = params.notebookDocument.version;
          const oldMetadata = notebookDocument.metadata;
          let metadataChanged = false;
          const change = params.change;
          if (change.metadata !== void 0) {
            metadataChanged = true;
            notebookDocument.metadata = change.metadata;
          }
          const opened = [];
          const closed = [];
          const data = [];
          const text = [];
          if (change.cells !== void 0) {
            const changedCells = change.cells;
            if (changedCells.structure !== void 0) {
              const array = changedCells.structure.array;
              notebookDocument.cells.splice(array.start, array.deleteCount, ...array.cells !== void 0 ? array.cells : []);
              if (changedCells.structure.didOpen !== void 0) {
                for (const open of changedCells.structure.didOpen) {
                  await cellTextDocumentConnection.openTextDocument({ textDocument: open });
                  opened.push(open.uri);
                }
              }
              if (changedCells.structure.didClose) {
                for (const close of changedCells.structure.didClose) {
                  await cellTextDocumentConnection.closeTextDocument({ textDocument: close });
                  closed.push(close.uri);
                }
              }
            }
            if (changedCells.data !== void 0) {
              const cellUpdates = new Map(changedCells.data.map((cell) => [cell.document, cell]));
              for (let i2 = 0; i2 <= notebookDocument.cells.length; i2++) {
                const change2 = cellUpdates.get(notebookDocument.cells[i2].document);
                if (change2 !== void 0) {
                  const old = notebookDocument.cells.splice(i2, 1, change2);
                  data.push({ old: old[0], new: change2 });
                  cellUpdates.delete(change2.document);
                  if (cellUpdates.size === 0) {
                    break;
                  }
                }
              }
            }
            if (changedCells.textContent !== void 0) {
              for (const cellTextDocument of changedCells.textContent) {
                await cellTextDocumentConnection.changeTextDocument({ textDocument: cellTextDocument.document, contentChanges: cellTextDocument.changes });
                text.push(cellTextDocument.document.uri);
              }
            }
          }
          this.updateCellMap(notebookDocument);
          const changeEvent = { notebookDocument };
          if (metadataChanged) {
            changeEvent.metadata = { old: oldMetadata, new: notebookDocument.metadata };
          }
          const added = [];
          for (const open of opened) {
            added.push(this.getNotebookCell(open));
          }
          const removed = [];
          for (const close of closed) {
            removed.push(this.getNotebookCell(close));
          }
          const textContent = [];
          for (const change2 of text) {
            textContent.push(this.getNotebookCell(change2));
          }
          if (added.length > 0 || removed.length > 0 || data.length > 0 || textContent.length > 0) {
            changeEvent.cells = { added, removed, changed: { data, textContent } };
          }
          if (changeEvent.metadata !== void 0 || changeEvent.cells !== void 0) {
            this._onDidChange.fire(changeEvent);
          }
        }));
        disposables.push(connection.notebooks.synchronization.onDidSaveNotebookDocument((params) => {
          const notebookDocument = this.notebookDocuments.get(params.notebookDocument.uri);
          if (notebookDocument === void 0) {
            return;
          }
          this._onDidSave.fire(notebookDocument);
        }));
        disposables.push(connection.notebooks.synchronization.onDidCloseNotebookDocument(async (params) => {
          const notebookDocument = this.notebookDocuments.get(params.notebookDocument.uri);
          if (notebookDocument === void 0) {
            return;
          }
          this._onDidClose.fire(notebookDocument);
          for (const cellTextDocument of params.cellTextDocuments) {
            await cellTextDocumentConnection.closeTextDocument({ textDocument: cellTextDocument });
          }
          this.notebookDocuments.delete(params.notebookDocument.uri);
          for (const cell of notebookDocument.cells) {
            this.notebookCellMap.delete(cell.document);
          }
        }));
        return vscode_languageserver_protocol_1.Disposable.create(() => {
          disposables.forEach((disposable) => disposable.dispose());
        });
      }
      updateCellMap(notebookDocument) {
        for (const cell of notebookDocument.cells) {
          this.notebookCellMap.set(cell.document, [cell, notebookDocument]);
        }
      }
    };
    exports2.NotebookDocuments = NotebookDocuments;
  }
});

// ../node_modules/vscode-languageserver/lib/common/moniker.js
var require_moniker = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/moniker.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MonikerFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var MonikerFeature = (Base) => {
      return class extends Base {
        get moniker() {
          return {
            on: (handler) => {
              const type = vscode_languageserver_protocol_1.MonikerRequest.type;
              return this.connection.onRequest(type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params), this.attachPartialResultProgress(type, params));
              });
            }
          };
        }
      };
    };
    exports2.MonikerFeature = MonikerFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/inlineCompletion.js
var require_inlineCompletion = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/inlineCompletion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InlineCompletionFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var InlineCompletionFeature = (Base) => {
      return class extends Base {
        get inlineCompletion() {
          return {
            on: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.InlineCompletionRequest.type, (params, cancel) => {
                return handler(params, cancel, this.attachWorkDoneProgress(params));
              });
            }
          };
        }
      };
    };
    exports2.InlineCompletionFeature = InlineCompletionFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/textDocumentContent.js
var require_textDocumentContent = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/textDocumentContent.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TextDocumentContentFeature = void 0;
    var vscode_languageserver_protocol_1 = require_api2();
    var TextDocumentContentFeature = (Base) => {
      return class extends Base {
        get textDocumentContent() {
          return {
            refresh: (uri) => {
              return this.connection.sendRequest(vscode_languageserver_protocol_1.TextDocumentContentRefreshRequest.type, { uri });
            },
            on: (handler) => {
              return this.connection.onRequest(vscode_languageserver_protocol_1.TextDocumentContentRequest.type, (params, cancel) => {
                return handler(params, cancel);
              });
            }
          };
        }
      };
    };
    exports2.TextDocumentContentFeature = TextDocumentContentFeature;
  }
});

// ../node_modules/vscode-languageserver/lib/common/server.js
var require_server = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/server.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2._NotebooksImpl = exports2._LanguagesImpl = exports2.BulkUnregistration = exports2.BulkRegistration = exports2.ErrorMessageTracker = void 0;
    exports2.combineConsoleFeatures = combineConsoleFeatures;
    exports2.combineTelemetryFeatures = combineTelemetryFeatures;
    exports2.combineTracerFeatures = combineTracerFeatures;
    exports2.combineClientFeatures = combineClientFeatures;
    exports2.combineWindowFeatures = combineWindowFeatures;
    exports2.combineWorkspaceFeatures = combineWorkspaceFeatures;
    exports2.combineLanguagesFeatures = combineLanguagesFeatures;
    exports2.combineNotebooksFeatures = combineNotebooksFeatures;
    exports2.combineFeatures = combineFeatures;
    exports2.createConnection = createConnection2;
    var vscode_languageserver_protocol_1 = require_api2();
    var Is2 = __importStar(require_is());
    var UUID = __importStar(require_uuid());
    var progress_1 = require_progress();
    var configuration_1 = require_configuration();
    var workspaceFolder_1 = require_workspaceFolder();
    var callHierarchy_1 = require_callHierarchy();
    var semanticTokens_1 = require_semanticTokens();
    var showDocument_1 = require_showDocument();
    var fileOperations_1 = require_fileOperations();
    var linkedEditingRange_1 = require_linkedEditingRange();
    var typeHierarchy_1 = require_typeHierarchy();
    var inlineValue_1 = require_inlineValue();
    var foldingRange_1 = require_foldingRange();
    var inlayHint_1 = require_inlayHint();
    var diagnostic_1 = require_diagnostic();
    var notebook_1 = require_notebook();
    var moniker_1 = require_moniker();
    var inlineCompletion_1 = require_inlineCompletion();
    var textDocumentContent_1 = require_textDocumentContent();
    function null2Undefined(value) {
      if (value === null) {
        return void 0;
      }
      return value;
    }
    var ErrorMessageTracker = class {
      _messages;
      constructor() {
        this._messages = /* @__PURE__ */ Object.create(null);
      }
      /**
       * Add a message to the tracker.
       *
       * @param message The message to add.
       */
      add(message) {
        let count = this._messages[message];
        if (!count) {
          count = 0;
        }
        count++;
        this._messages[message] = count;
      }
      /**
       * Send all tracked messages to the connection's window.
       *
       * @param connection The connection established between client and server.
       */
      sendErrors(connection) {
        Object.keys(this._messages).forEach((message) => {
          connection.window.showErrorMessage(message);
        });
      }
    };
    exports2.ErrorMessageTracker = ErrorMessageTracker;
    var RemoteConsoleImpl = class {
      _rawConnection;
      _connection;
      constructor() {
      }
      rawAttach(connection) {
        this._rawConnection = connection;
      }
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      fillServerCapabilities(_capabilities) {
      }
      initialize(_capabilities) {
      }
      error(message) {
        this.send(vscode_languageserver_protocol_1.MessageType.Error, message);
      }
      warn(message) {
        this.send(vscode_languageserver_protocol_1.MessageType.Warning, message);
      }
      info(message) {
        this.send(vscode_languageserver_protocol_1.MessageType.Info, message);
      }
      log(message) {
        this.send(vscode_languageserver_protocol_1.MessageType.Log, message);
      }
      debug(message) {
        this.send(vscode_languageserver_protocol_1.MessageType.Debug, message);
      }
      send(type, message) {
        if (this._rawConnection) {
          this._rawConnection.sendNotification(vscode_languageserver_protocol_1.LogMessageNotification.type, { type, message }).catch(() => {
            (0, vscode_languageserver_protocol_1.RAL)().console.error(`Sending log message failed`);
          });
        }
      }
    };
    var _RemoteWindowImpl = class {
      _connection;
      constructor() {
      }
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      initialize(_capabilities) {
      }
      fillServerCapabilities(_capabilities) {
      }
      showErrorMessage(message, ...actions) {
        const params = { type: vscode_languageserver_protocol_1.MessageType.Error, message, actions };
        return this.connection.sendRequest(vscode_languageserver_protocol_1.ShowMessageRequest.type, params).then(null2Undefined);
      }
      showWarningMessage(message, ...actions) {
        const params = { type: vscode_languageserver_protocol_1.MessageType.Warning, message, actions };
        return this.connection.sendRequest(vscode_languageserver_protocol_1.ShowMessageRequest.type, params).then(null2Undefined);
      }
      showInformationMessage(message, ...actions) {
        const params = { type: vscode_languageserver_protocol_1.MessageType.Info, message, actions };
        return this.connection.sendRequest(vscode_languageserver_protocol_1.ShowMessageRequest.type, params).then(null2Undefined);
      }
    };
    var RemoteWindowImpl = (0, showDocument_1.ShowDocumentFeature)((0, progress_1.ProgressFeature)(_RemoteWindowImpl));
    var BulkRegistration;
    (function(BulkRegistration2) {
      function create() {
        return new BulkRegistrationImpl();
      }
      BulkRegistration2.create = create;
    })(BulkRegistration || (exports2.BulkRegistration = BulkRegistration = {}));
    var BulkRegistrationImpl = class {
      _registrations = [];
      _registered = /* @__PURE__ */ new Set();
      add(type, registerOptions) {
        const method = Is2.string(type) ? type : type.method;
        if (this._registered.has(method)) {
          throw new Error(`${method} is already added to this registration`);
        }
        const id = UUID.generateUuid();
        this._registrations.push({
          id,
          method,
          registerOptions: registerOptions || {}
        });
        this._registered.add(method);
      }
      asRegistrationParams() {
        return {
          registrations: this._registrations
        };
      }
    };
    var BulkUnregistration;
    (function(BulkUnregistration2) {
      function create() {
        return new BulkUnregistrationImpl(void 0, []);
      }
      BulkUnregistration2.create = create;
    })(BulkUnregistration || (exports2.BulkUnregistration = BulkUnregistration = {}));
    var BulkUnregistrationImpl = class {
      _connection;
      _unregistrations = /* @__PURE__ */ new Map();
      constructor(_connection, unregistrations) {
        this._connection = _connection;
        unregistrations.forEach((unregistration) => {
          this._unregistrations.set(unregistration.method, unregistration);
        });
      }
      get isAttached() {
        return !!this._connection;
      }
      attach(connection) {
        this._connection = connection;
      }
      add(unregistration) {
        this._unregistrations.set(unregistration.method, unregistration);
      }
      dispose() {
        const unregistrations = [];
        for (const unregistration of this._unregistrations.values()) {
          unregistrations.push(unregistration);
        }
        const params = {
          unregisterations: unregistrations
        };
        this._connection.sendRequest(vscode_languageserver_protocol_1.UnregistrationRequest.type, params).catch(() => {
          this._connection.console.info(`Bulk unregistration failed.`);
        });
      }
      disposeSingle(arg) {
        const method = Is2.string(arg) ? arg : arg.method;
        const unregistration = this._unregistrations.get(method);
        if (!unregistration) {
          return false;
        }
        const params = {
          unregisterations: [unregistration]
        };
        this._connection.sendRequest(vscode_languageserver_protocol_1.UnregistrationRequest.type, params).then(() => {
          this._unregistrations.delete(method);
        }, (_error) => {
          this._connection.console.info(`Un-registering request handler for ${unregistration.id} failed.`);
        });
        return true;
      }
    };
    var RemoteClientImpl = class {
      _connection;
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      initialize(_capabilities) {
      }
      fillServerCapabilities(_capabilities) {
      }
      register(typeOrRegistrations, registerOptionsOrType, registerOptions) {
        if (typeOrRegistrations instanceof BulkRegistrationImpl) {
          return this.registerMany(typeOrRegistrations);
        } else if (typeOrRegistrations instanceof BulkUnregistrationImpl) {
          return this.registerSingle1(typeOrRegistrations, registerOptionsOrType, registerOptions);
        } else {
          return this.registerSingle2(typeOrRegistrations, registerOptionsOrType);
        }
      }
      registerSingle1(unregistration, type, registerOptions) {
        const method = Is2.string(type) ? type : type.method;
        const id = UUID.generateUuid();
        const params = {
          registrations: [{ id, method, registerOptions: registerOptions || {} }]
        };
        if (!unregistration.isAttached) {
          unregistration.attach(this.connection);
        }
        return this.connection.sendRequest(vscode_languageserver_protocol_1.RegistrationRequest.type, params).then((_result) => {
          unregistration.add({ id, method });
          return unregistration;
        }, (_error) => {
          this.connection.console.info(`Registering request handler for ${method} failed.`);
          return Promise.reject(_error);
        });
      }
      registerSingle2(type, registerOptions) {
        const method = Is2.string(type) ? type : type.method;
        const id = UUID.generateUuid();
        const params = {
          registrations: [{ id, method, registerOptions: registerOptions || {} }]
        };
        return this.connection.sendRequest(vscode_languageserver_protocol_1.RegistrationRequest.type, params).then((_result) => {
          return vscode_languageserver_protocol_1.Disposable.create(() => {
            this.unregisterSingle(id, method).catch(() => {
              this.connection.console.info(`Un-registering capability with id ${id} failed.`);
            });
          });
        }, (_error) => {
          this.connection.console.info(`Registering request handler for ${method} failed.`);
          return Promise.reject(_error);
        });
      }
      unregisterSingle(id, method) {
        const params = {
          unregisterations: [{ id, method }]
        };
        return this.connection.sendRequest(vscode_languageserver_protocol_1.UnregistrationRequest.type, params).catch(() => {
          this.connection.console.info(`Un-registering request handler for ${id} failed.`);
        });
      }
      registerMany(registrations) {
        const params = registrations.asRegistrationParams();
        return this.connection.sendRequest(vscode_languageserver_protocol_1.RegistrationRequest.type, params).then(() => {
          return new BulkUnregistrationImpl(this._connection, params.registrations.map((registration) => {
            return { id: registration.id, method: registration.method };
          }));
        }, (_error) => {
          this.connection.console.info(`Bulk registration failed.`);
          return Promise.reject(_error);
        });
      }
    };
    var _RemoteWorkspaceImpl = class {
      _connection;
      constructor() {
      }
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      initialize(_capabilities) {
      }
      fillServerCapabilities(_capabilities) {
      }
      applyEdit(paramOrEdit) {
        function isApplyWorkspaceEditParams(value) {
          return value && !!value.edit;
        }
        const params = isApplyWorkspaceEditParams(paramOrEdit) ? paramOrEdit : { edit: paramOrEdit };
        return this.connection.sendRequest(vscode_languageserver_protocol_1.ApplyWorkspaceEditRequest.type, params);
      }
    };
    var RemoteWorkspaceImpl = (0, textDocumentContent_1.TextDocumentContentFeature)((0, fileOperations_1.FileOperationsFeature)((0, workspaceFolder_1.WorkspaceFoldersFeature)((0, configuration_1.ConfigurationFeature)(_RemoteWorkspaceImpl))));
    var TracerImpl = class {
      _trace;
      _connection;
      constructor() {
        this._trace = vscode_languageserver_protocol_1.Trace.Off;
      }
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      initialize(_capabilities) {
      }
      fillServerCapabilities(_capabilities) {
      }
      set trace(value) {
        this._trace = value;
      }
      log(message, verbose) {
        if (this._trace === vscode_languageserver_protocol_1.Trace.Off) {
          return;
        }
        this.connection.sendNotification(vscode_languageserver_protocol_1.LogTraceNotification.type, {
          message,
          verbose: this._trace === vscode_languageserver_protocol_1.Trace.Verbose ? verbose : void 0
        }).catch(() => {
        });
      }
    };
    var TelemetryImpl = class {
      _connection;
      constructor() {
      }
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      initialize(_capabilities) {
      }
      fillServerCapabilities(_capabilities) {
      }
      logEvent(data) {
        this.connection.sendNotification(vscode_languageserver_protocol_1.TelemetryEventNotification.type, data).catch(() => {
          this.connection.console.log(`Sending TelemetryEventNotification failed`);
        });
      }
    };
    var _LanguagesImpl = class {
      _connection;
      constructor() {
      }
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      initialize(_capabilities) {
      }
      fillServerCapabilities(_capabilities) {
      }
      attachWorkDoneProgress(params) {
        return (0, progress_1.attachWorkDone)(this.connection, params);
      }
      attachPartialResultProgress(_type, params) {
        return (0, progress_1.attachPartialResult)(this.connection, params);
      }
    };
    exports2._LanguagesImpl = _LanguagesImpl;
    var LanguagesImpl = (0, inlineCompletion_1.InlineCompletionFeature)((0, foldingRange_1.FoldingRangeFeature)((0, moniker_1.MonikerFeature)((0, diagnostic_1.DiagnosticFeature)((0, inlayHint_1.InlayHintFeature)((0, inlineValue_1.InlineValueFeature)((0, typeHierarchy_1.TypeHierarchyFeature)((0, linkedEditingRange_1.LinkedEditingRangeFeature)((0, semanticTokens_1.SemanticTokensFeature)((0, callHierarchy_1.CallHierarchyFeature)(_LanguagesImpl))))))))));
    var _NotebooksImpl = class {
      _connection;
      constructor() {
      }
      attach(connection) {
        this._connection = connection;
      }
      get connection() {
        if (!this._connection) {
          throw new Error("Remote is not attached to a connection yet.");
        }
        return this._connection;
      }
      initialize(_capabilities) {
      }
      fillServerCapabilities(_capabilities) {
      }
      attachWorkDoneProgress(params) {
        return (0, progress_1.attachWorkDone)(this.connection, params);
      }
      attachPartialResultProgress(_type, params) {
        return (0, progress_1.attachPartialResult)(this.connection, params);
      }
    };
    exports2._NotebooksImpl = _NotebooksImpl;
    var NotebooksImpl = (0, notebook_1.NotebookSyncFeature)(_NotebooksImpl);
    function combineConsoleFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineTelemetryFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineTracerFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineClientFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineWindowFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineWorkspaceFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineLanguagesFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineNotebooksFeatures(one, two) {
      return function(Base) {
        return two(one(Base));
      };
    }
    function combineFeatures(one, two) {
      function combine(one2, two2, func) {
        if (one2 && two2) {
          return func(one2, two2);
        } else if (one2) {
          return one2;
        } else {
          return two2;
        }
      }
      const result = {
        __brand: "features",
        console: combine(one.console, two.console, combineConsoleFeatures),
        tracer: combine(one.tracer, two.tracer, combineTracerFeatures),
        telemetry: combine(one.telemetry, two.telemetry, combineTelemetryFeatures),
        client: combine(one.client, two.client, combineClientFeatures),
        window: combine(one.window, two.window, combineWindowFeatures),
        workspace: combine(one.workspace, two.workspace, combineWorkspaceFeatures),
        languages: combine(one.languages, two.languages, combineLanguagesFeatures),
        notebooks: combine(one.notebooks, two.notebooks, combineNotebooksFeatures)
      };
      return result;
    }
    function createConnection2(connectionFactory, watchDog, factories) {
      const logger = factories && factories.console ? new (factories.console(RemoteConsoleImpl))() : new RemoteConsoleImpl();
      const connection = connectionFactory(logger);
      logger.rawAttach(connection);
      const tracer = factories && factories.tracer ? new (factories.tracer(TracerImpl))() : new TracerImpl();
      const telemetry = factories && factories.telemetry ? new (factories.telemetry(TelemetryImpl))() : new TelemetryImpl();
      const client = factories && factories.client ? new (factories.client(RemoteClientImpl))() : new RemoteClientImpl();
      const remoteWindow = factories && factories.window ? new (factories.window(RemoteWindowImpl))() : new RemoteWindowImpl();
      const workspace = factories && factories.workspace ? new (factories.workspace(RemoteWorkspaceImpl))() : new RemoteWorkspaceImpl();
      const languages = factories && factories.languages ? new (factories.languages(LanguagesImpl))() : new LanguagesImpl();
      const notebooks = factories && factories.notebooks ? new (factories.notebooks(NotebooksImpl))() : new NotebooksImpl();
      const allRemotes = [logger, tracer, telemetry, client, remoteWindow, workspace, languages, notebooks];
      function asPromise(value) {
        if (value instanceof Promise) {
          return value;
        } else if (Is2.thenable(value)) {
          return new Promise((resolve2, reject) => {
            value.then((resolved) => resolve2(resolved), (error) => reject(error));
          });
        } else {
          return Promise.resolve(value);
        }
      }
      let shutdownHandler = void 0;
      let initializeHandler = void 0;
      let exitHandler = void 0;
      const protocolConnection = {
        listen: () => connection.listen(),
        sendRequest: (type, ...params) => connection.sendRequest(Is2.string(type) ? type : type.method, ...params),
        onRequest: (type, handler) => connection.onRequest(type, handler),
        sendNotification: (type, param) => {
          const method = Is2.string(type) ? type : type.method;
          return connection.sendNotification(method, param);
        },
        onNotification: (type, handler) => connection.onNotification(type, handler),
        onProgress: connection.onProgress,
        sendProgress: connection.sendProgress,
        onInitialize: (handler) => {
          initializeHandler = handler;
          return {
            dispose: () => {
              initializeHandler = void 0;
            }
          };
        },
        onInitialized: (handler) => connection.onNotification(vscode_languageserver_protocol_1.InitializedNotification.type, handler),
        onShutdown: (handler) => {
          shutdownHandler = handler;
          return {
            dispose: () => {
              shutdownHandler = void 0;
            }
          };
        },
        onExit: (handler) => {
          exitHandler = handler;
          return {
            dispose: () => {
              exitHandler = void 0;
            }
          };
        },
        get console() {
          return logger;
        },
        get telemetry() {
          return telemetry;
        },
        get tracer() {
          return tracer;
        },
        get client() {
          return client;
        },
        get window() {
          return remoteWindow;
        },
        get workspace() {
          return workspace;
        },
        get languages() {
          return languages;
        },
        get notebooks() {
          return notebooks;
        },
        onDidChangeConfiguration: (handler) => connection.onNotification(vscode_languageserver_protocol_1.DidChangeConfigurationNotification.type, handler),
        onDidChangeWatchedFiles: (handler) => connection.onNotification(vscode_languageserver_protocol_1.DidChangeWatchedFilesNotification.type, handler),
        __textDocumentSync: void 0,
        onDidOpenTextDocument: (handler) => connection.onNotification(vscode_languageserver_protocol_1.DidOpenTextDocumentNotification.type, handler),
        onDidChangeTextDocument: (handler) => connection.onNotification(vscode_languageserver_protocol_1.DidChangeTextDocumentNotification.type, handler),
        onDidCloseTextDocument: (handler) => connection.onNotification(vscode_languageserver_protocol_1.DidCloseTextDocumentNotification.type, handler),
        onWillSaveTextDocument: (handler) => connection.onNotification(vscode_languageserver_protocol_1.WillSaveTextDocumentNotification.type, handler),
        onWillSaveTextDocumentWaitUntil: (handler) => connection.onRequest(vscode_languageserver_protocol_1.WillSaveTextDocumentWaitUntilRequest.type, handler),
        onDidSaveTextDocument: (handler) => connection.onNotification(vscode_languageserver_protocol_1.DidSaveTextDocumentNotification.type, handler),
        sendDiagnostics: (params) => connection.sendNotification(vscode_languageserver_protocol_1.PublishDiagnosticsNotification.type, params),
        onHover: (handler) => connection.onRequest(vscode_languageserver_protocol_1.HoverRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), void 0);
        }),
        onCompletion: (handler) => connection.onRequest(vscode_languageserver_protocol_1.CompletionRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onCompletionResolve: (handler) => connection.onRequest(vscode_languageserver_protocol_1.CompletionResolveRequest.type, handler),
        onSignatureHelp: (handler) => connection.onRequest(vscode_languageserver_protocol_1.SignatureHelpRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), void 0);
        }),
        onDeclaration: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DeclarationRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onDefinition: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DefinitionRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onTypeDefinition: (handler) => connection.onRequest(vscode_languageserver_protocol_1.TypeDefinitionRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onImplementation: (handler) => connection.onRequest(vscode_languageserver_protocol_1.ImplementationRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onReferences: (handler) => connection.onRequest(vscode_languageserver_protocol_1.ReferencesRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onDocumentHighlight: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentHighlightRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onDocumentSymbol: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentSymbolRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onWorkspaceSymbol: (handler) => connection.onRequest(vscode_languageserver_protocol_1.WorkspaceSymbolRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onWorkspaceSymbolResolve: (handler) => connection.onRequest(vscode_languageserver_protocol_1.WorkspaceSymbolResolveRequest.type, handler),
        onCodeAction: (handler) => connection.onRequest(vscode_languageserver_protocol_1.CodeActionRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onCodeActionResolve: (handler) => connection.onRequest(vscode_languageserver_protocol_1.CodeActionResolveRequest.type, (params, cancel) => {
          return handler(params, cancel);
        }),
        onCodeLens: (handler) => connection.onRequest(vscode_languageserver_protocol_1.CodeLensRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onCodeLensResolve: (handler) => connection.onRequest(vscode_languageserver_protocol_1.CodeLensResolveRequest.type, (params, cancel) => {
          return handler(params, cancel);
        }),
        onDocumentFormatting: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentFormattingRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), void 0);
        }),
        onDocumentRangeFormatting: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentRangeFormattingRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), void 0);
        }),
        onDocumentRangesFormatting: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentRangesFormattingRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), void 0);
        }),
        onDocumentOnTypeFormatting: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentOnTypeFormattingRequest.type, (params, cancel) => {
          return handler(params, cancel);
        }),
        onRenameRequest: (handler) => connection.onRequest(vscode_languageserver_protocol_1.RenameRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), void 0);
        }),
        onPrepareRename: (handler) => connection.onRequest(vscode_languageserver_protocol_1.PrepareRenameRequest.type, (params, cancel) => {
          return handler(params, cancel);
        }),
        onDocumentLinks: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentLinkRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onDocumentLinkResolve: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentLinkResolveRequest.type, (params, cancel) => {
          return handler(params, cancel);
        }),
        onDocumentColor: (handler) => connection.onRequest(vscode_languageserver_protocol_1.DocumentColorRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onColorPresentation: (handler) => connection.onRequest(vscode_languageserver_protocol_1.ColorPresentationRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onFoldingRanges: (handler) => connection.onRequest(vscode_languageserver_protocol_1.FoldingRangeRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onSelectionRanges: (handler) => connection.onRequest(vscode_languageserver_protocol_1.SelectionRangeRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), (0, progress_1.attachPartialResult)(connection, params));
        }),
        onExecuteCommand: (handler) => connection.onRequest(vscode_languageserver_protocol_1.ExecuteCommandRequest.type, (params, cancel) => {
          return handler(params, cancel, (0, progress_1.attachWorkDone)(connection, params), void 0);
        }),
        dispose: () => connection.dispose()
      };
      for (const remote of allRemotes) {
        remote.attach(protocolConnection);
      }
      connection.onRequest(vscode_languageserver_protocol_1.InitializeRequest.type, (params) => {
        watchDog.initialize(params);
        if (Is2.string(params.trace)) {
          tracer.trace = vscode_languageserver_protocol_1.Trace.fromString(params.trace);
        }
        for (const remote of allRemotes) {
          remote.initialize(params.capabilities);
        }
        if (initializeHandler) {
          const result = initializeHandler(params, new vscode_languageserver_protocol_1.CancellationTokenSource().token, (0, progress_1.attachWorkDone)(connection, params), void 0);
          return asPromise(result).then((value) => {
            if (value instanceof vscode_languageserver_protocol_1.ResponseError) {
              return value;
            }
            let result2 = value;
            if (!result2) {
              result2 = { capabilities: {} };
            }
            let capabilities = result2.capabilities;
            if (!capabilities) {
              capabilities = {};
              result2.capabilities = capabilities;
            }
            if (capabilities.textDocumentSync === void 0 || capabilities.textDocumentSync === null) {
              capabilities.textDocumentSync = Is2.number(protocolConnection.__textDocumentSync) ? protocolConnection.__textDocumentSync : vscode_languageserver_protocol_1.TextDocumentSyncKind.None;
            } else if (!Is2.number(capabilities.textDocumentSync) && !Is2.number(capabilities.textDocumentSync.change)) {
              capabilities.textDocumentSync.change = Is2.number(protocolConnection.__textDocumentSync) ? protocolConnection.__textDocumentSync : vscode_languageserver_protocol_1.TextDocumentSyncKind.None;
            }
            for (const remote of allRemotes) {
              remote.fillServerCapabilities(capabilities);
            }
            return result2;
          });
        } else {
          const result = { capabilities: { textDocumentSync: vscode_languageserver_protocol_1.TextDocumentSyncKind.None } };
          for (const remote of allRemotes) {
            remote.fillServerCapabilities(result.capabilities);
          }
          return result;
        }
      });
      connection.onRequest(vscode_languageserver_protocol_1.ShutdownRequest.type, () => {
        watchDog.shutdownReceived = true;
        if (shutdownHandler) {
          return shutdownHandler(new vscode_languageserver_protocol_1.CancellationTokenSource().token);
        } else {
          return void 0;
        }
      });
      connection.onNotification(vscode_languageserver_protocol_1.ExitNotification.type, () => {
        try {
          if (exitHandler) {
            return exitHandler();
          }
        } finally {
          if (watchDog.shutdownReceived) {
            watchDog.exit(0);
          } else {
            watchDog.exit(1);
          }
        }
      });
      connection.onNotification(vscode_languageserver_protocol_1.SetTraceNotification.type, (params) => {
        tracer.trace = vscode_languageserver_protocol_1.Trace.fromString(params.value);
      });
      return protocolConnection;
    }
  }
});

// ../node_modules/vscode-languageserver/lib/node/files.js
var require_files = __commonJS({
  "../node_modules/vscode-languageserver/lib/node/files.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FileSystem = void 0;
    exports2.uriToFilePath = uriToFilePath;
    exports2.resolve = resolve2;
    exports2.resolveGlobalNodePath = resolveGlobalNodePath;
    exports2.resolveGlobalYarnPath = resolveGlobalYarnPath;
    exports2.resolveModulePath = resolveModulePath;
    var url = __importStar(require("url"));
    var path = __importStar(require("path"));
    var fs = __importStar(require("fs"));
    var child_process_1 = require("child_process");
    function uriToFilePath(uri) {
      const parsed = url.parse(uri);
      if (parsed.protocol !== "file:" || !parsed.path) {
        return void 0;
      }
      const segments = parsed.path.split("/");
      for (let i2 = 0, len = segments.length; i2 < len; i2++) {
        segments[i2] = decodeURIComponent(segments[i2]);
      }
      if (process.platform === "win32" && segments.length > 1) {
        const first = segments[0];
        const second = segments[1];
        if (first.length === 0 && second.length > 1 && second[1] === ":") {
          segments.shift();
        }
      }
      return path.normalize(segments.join("/"));
    }
    function isWindows() {
      return process.platform === "win32";
    }
    function resolve2(moduleName, nodePath, cwd, tracer) {
      const nodePathKey = "NODE_PATH";
      const app = [
        "var p = process;",
        "p.on('message',function(m){",
        "if(m.c==='e'){",
        "p.exit(0);",
        "}",
        "else if(m.c==='rs'){",
        "try{",
        "var r=require.resolve(m.a);",
        "p.send({c:'r',s:true,r:r});",
        "}",
        "catch(err){",
        "p.send({c:'r',s:false});",
        "}",
        "}",
        "});"
      ].join("");
      return new Promise((resolve3, reject) => {
        const env = process.env;
        const newEnv = /* @__PURE__ */ Object.create(null);
        Object.keys(env).forEach((key) => newEnv[key] = env[key]);
        if (nodePath && fs.existsSync(nodePath)) {
          if (newEnv[nodePathKey]) {
            newEnv[nodePathKey] = nodePath + path.delimiter + newEnv[nodePathKey];
          } else {
            newEnv[nodePathKey] = nodePath;
          }
          if (tracer) {
            tracer(`NODE_PATH value is: ${newEnv[nodePathKey]}`);
          }
        }
        newEnv["ELECTRON_RUN_AS_NODE"] = "1";
        try {
          const cp = (0, child_process_1.fork)("", [], {
            cwd,
            env: newEnv,
            execArgv: ["-e", app]
          });
          if (cp.pid === void 0) {
            reject(new Error(`Starting process to resolve node module  ${moduleName} failed`));
            return;
          }
          cp.on("error", (error) => {
            reject(error);
          });
          cp.on("message", (message2) => {
            if (message2.c === "r") {
              cp.send({ c: "e" });
              if (message2.s) {
                resolve3(message2.r);
              } else {
                reject(new Error(`Failed to resolve module: ${moduleName}`));
              }
            }
          });
          const message = {
            c: "rs",
            a: moduleName
          };
          cp.send(message);
        } catch (error) {
          reject(error);
        }
      });
    }
    function resolveGlobalNodePath(tracer) {
      let npmCommand = "npm";
      const env = /* @__PURE__ */ Object.create(null);
      Object.keys(process.env).forEach((key) => env[key] = process.env[key]);
      env["NO_UPDATE_NOTIFIER"] = "true";
      const options = {
        encoding: "utf8",
        env
      };
      if (isWindows()) {
        npmCommand = "npm.cmd";
        options.shell = true;
      }
      const handler = () => {
      };
      try {
        process.on("SIGPIPE", handler);
        const stdout = (0, child_process_1.spawnSync)(npmCommand, ["config", "get", "prefix"], options).stdout;
        if (!stdout) {
          if (tracer) {
            tracer(`'npm config get prefix' didn't return a value.`);
          }
          return void 0;
        }
        const prefix = stdout.trim();
        if (tracer) {
          tracer(`'npm config get prefix' value is: ${prefix}`);
        }
        if (prefix.length > 0) {
          if (isWindows()) {
            return path.join(prefix, "node_modules");
          } else {
            return path.join(prefix, "lib", "node_modules");
          }
        }
        return void 0;
      } catch (err) {
        return void 0;
      } finally {
        process.removeListener("SIGPIPE", handler);
      }
    }
    function resolveGlobalYarnPath(tracer) {
      let yarnCommand = "yarn";
      const options = {
        encoding: "utf8"
      };
      if (isWindows()) {
        yarnCommand = "yarn.cmd";
        options.shell = true;
      }
      const handler = () => {
      };
      try {
        process.on("SIGPIPE", handler);
        const results = (0, child_process_1.spawnSync)(yarnCommand, ["global", "dir", "--json"], options);
        const stdout = results.stdout;
        if (!stdout) {
          if (tracer) {
            tracer(`'yarn global dir' didn't return a value.`);
            if (results.stderr) {
              tracer(results.stderr);
            }
          }
          return void 0;
        }
        const lines = stdout.trim().split(/\r?\n/);
        for (const line2 of lines) {
          try {
            const yarn = JSON.parse(line2);
            if (yarn.type === "log") {
              return path.join(yarn.data, "node_modules");
            }
          } catch (e2) {
          }
        }
        return void 0;
      } catch (err) {
        return void 0;
      } finally {
        process.removeListener("SIGPIPE", handler);
      }
    }
    var FileSystem;
    (function(FileSystem2) {
      let _isCaseSensitive = void 0;
      function isCaseSensitive() {
        if (_isCaseSensitive !== void 0) {
          return _isCaseSensitive;
        }
        if (process.platform === "win32") {
          _isCaseSensitive = false;
        } else {
          _isCaseSensitive = !fs.existsSync(__filename.toUpperCase()) || !fs.existsSync(__filename.toLowerCase());
        }
        return _isCaseSensitive;
      }
      FileSystem2.isCaseSensitive = isCaseSensitive;
      function isParent(parent, child) {
        if (isCaseSensitive()) {
          return path.normalize(child).indexOf(path.normalize(parent)) === 0;
        } else {
          return path.normalize(child).toLowerCase().indexOf(path.normalize(parent).toLowerCase()) === 0;
        }
      }
      FileSystem2.isParent = isParent;
    })(FileSystem || (exports2.FileSystem = FileSystem = {}));
    function resolveModulePath(workspaceRoot, moduleName, nodePath, tracer) {
      if (nodePath) {
        if (!path.isAbsolute(nodePath)) {
          nodePath = path.join(workspaceRoot, nodePath);
        }
        return resolve2(moduleName, nodePath, nodePath, tracer).then((value) => {
          if (FileSystem.isParent(nodePath, value)) {
            return value;
          } else {
            return Promise.reject(new Error(`Failed to load ${moduleName} from node path location.`));
          }
        }).then(void 0, (_error) => {
          return resolve2(moduleName, resolveGlobalNodePath(tracer), workspaceRoot, tracer);
        });
      } else {
        return resolve2(moduleName, resolveGlobalNodePath(tracer), workspaceRoot, tracer);
      }
    }
  }
});

// ../node_modules/vscode-jsonrpc/lib/node/ril.js
var require_ril = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/node/ril.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var util_1 = require("util");
    var api_1 = require_api();
    var MessageBuffer = class _MessageBuffer extends api_1.AbstractMessageBuffer {
      static emptyBuffer = Buffer.allocUnsafe(0);
      constructor(encoding = "utf-8") {
        super(encoding);
      }
      emptyBuffer() {
        return _MessageBuffer.emptyBuffer;
      }
      fromString(value, encoding) {
        return Buffer.from(value, encoding);
      }
      toString(value, encoding) {
        if (value instanceof Buffer) {
          return value.toString(encoding);
        } else {
          return new util_1.TextDecoder(encoding).decode(value);
        }
      }
      asNative(buffer, length) {
        if (length === void 0) {
          return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        } else {
          return buffer instanceof Buffer ? buffer.slice(0, length) : Buffer.from(buffer, 0, length);
        }
      }
      allocNative(length) {
        return Buffer.allocUnsafe(length);
      }
    };
    var ReadableStreamWrapper = class {
      stream;
      constructor(stream) {
        this.stream = stream;
      }
      onClose(listener) {
        this.stream.on("close", listener);
        return api_1.Disposable.create(() => this.stream.off("close", listener));
      }
      onError(listener) {
        this.stream.on("error", listener);
        return api_1.Disposable.create(() => this.stream.off("error", listener));
      }
      onEnd(listener) {
        this.stream.on("end", listener);
        return api_1.Disposable.create(() => this.stream.off("end", listener));
      }
      onData(listener) {
        this.stream.on("data", listener);
        return api_1.Disposable.create(() => this.stream.off("data", listener));
      }
    };
    var WritableStreamWrapper = class {
      stream;
      constructor(stream) {
        this.stream = stream;
      }
      onClose(listener) {
        this.stream.on("close", listener);
        return api_1.Disposable.create(() => this.stream.off("close", listener));
      }
      onError(listener) {
        this.stream.on("error", listener);
        return api_1.Disposable.create(() => this.stream.off("error", listener));
      }
      onEnd(listener) {
        this.stream.on("end", listener);
        return api_1.Disposable.create(() => this.stream.off("end", listener));
      }
      write(data, encoding) {
        return new Promise((resolve2, reject) => {
          const callback = (error) => {
            if (error === void 0 || error === null) {
              resolve2();
            } else {
              reject(error);
            }
          };
          if (typeof data === "string") {
            this.stream.write(data, encoding, callback);
          } else {
            this.stream.write(data, callback);
          }
        });
      }
      end() {
        this.stream.end();
      }
    };
    var _ril = Object.freeze({
      messageBuffer: Object.freeze({
        create: (encoding) => new MessageBuffer(encoding)
      }),
      applicationJson: Object.freeze({
        encoder: Object.freeze({
          name: "application/json",
          encode: (msg, options) => {
            try {
              return Promise.resolve(Buffer.from(JSON.stringify(msg, void 0, 0), options.charset));
            } catch (err) {
              return Promise.reject(err);
            }
          }
        }),
        decoder: Object.freeze({
          name: "application/json",
          decode: (buffer, options) => {
            try {
              if (buffer instanceof Buffer) {
                return Promise.resolve(JSON.parse(buffer.toString(options.charset)));
              } else {
                return Promise.resolve(JSON.parse(new util_1.TextDecoder(options.charset).decode(buffer)));
              }
            } catch (err) {
              return Promise.reject(err);
            }
          }
        })
      }),
      stream: Object.freeze({
        asReadableStream: (stream) => new ReadableStreamWrapper(stream),
        asWritableStream: (stream) => new WritableStreamWrapper(stream)
      }),
      console,
      timer: Object.freeze({
        setTimeout(callback, ms, ...args) {
          const handle = setTimeout(callback, ms, ...args);
          return { dispose: () => clearTimeout(handle) };
        },
        setImmediate(callback, ...args) {
          const handle = setImmediate(callback, ...args);
          return { dispose: () => clearImmediate(handle) };
        },
        setInterval(callback, ms, ...args) {
          const handle = setInterval(callback, ms, ...args);
          return { dispose: () => clearInterval(handle) };
        }
      })
    });
    function RIL() {
      return _ril;
    }
    (function(RIL2) {
      function install() {
        api_1.RAL.install(_ril);
      }
      RIL2.install = install;
    })(RIL || (RIL = {}));
    exports2.default = RIL;
  }
});

// ../node_modules/vscode-jsonrpc/lib/node/main.js
var require_main = __commonJS({
  "../node_modules/vscode-jsonrpc/lib/node/main.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.StreamMessageWriter = exports2.StreamMessageReader = exports2.SocketMessageWriter = exports2.SocketMessageReader = exports2.PortMessageWriter = exports2.PortMessageReader = exports2.IPCMessageWriter = exports2.IPCMessageReader = void 0;
    exports2.generateRandomPipeName = generateRandomPipeName;
    exports2.createClientPipeTransport = createClientPipeTransport;
    exports2.createServerPipeTransport = createServerPipeTransport;
    exports2.createClientSocketTransport = createClientSocketTransport;
    exports2.createServerSocketTransport = createServerSocketTransport;
    exports2.createMessageConnection = createMessageConnection;
    var ril_1 = __importDefault(require_ril());
    ril_1.default.install();
    var path = __importStar(require("path"));
    var os = __importStar(require("os"));
    var fs = __importStar(require("fs"));
    var crypto_1 = require("crypto");
    var net_1 = require("net");
    var api_1 = require_api();
    __exportStar(require_api(), exports2);
    var IPCMessageReader = class extends api_1.AbstractMessageReader {
      process;
      constructor(process2) {
        super();
        this.process = process2;
        const eventEmitter = this.process;
        eventEmitter.on("error", (error) => this.fireError(error));
        eventEmitter.on("close", () => this.fireClose());
      }
      listen(callback) {
        this.process.on("message", callback);
        return api_1.Disposable.create(() => this.process.off("message", callback));
      }
    };
    exports2.IPCMessageReader = IPCMessageReader;
    var IPCMessageWriter = class extends api_1.AbstractMessageWriter {
      process;
      errorCount;
      constructor(process2) {
        super();
        this.process = process2;
        this.errorCount = 0;
        const eventEmitter = this.process;
        eventEmitter.on("error", (error) => this.fireError(error));
        eventEmitter.on("close", () => this.fireClose);
      }
      write(msg) {
        try {
          if (typeof this.process.send === "function") {
            this.process.send(msg, void 0, void 0, (error) => {
              if (error) {
                this.errorCount++;
                this.handleError(error, msg);
              } else {
                this.errorCount = 0;
              }
            });
          }
          return Promise.resolve();
        } catch (error) {
          this.handleError(error, msg);
          return Promise.reject(error);
        }
      }
      handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
      }
      end() {
      }
    };
    exports2.IPCMessageWriter = IPCMessageWriter;
    var PortMessageReader = class extends api_1.AbstractMessageReader {
      onData;
      constructor(port) {
        super();
        this.onData = new api_1.Emitter();
        port.on("close", () => this.fireClose);
        port.on("error", (error) => this.fireError(error));
        port.on("message", (message) => {
          this.onData.fire(message);
        });
      }
      listen(callback) {
        return this.onData.event(callback);
      }
    };
    exports2.PortMessageReader = PortMessageReader;
    var PortMessageWriter = class extends api_1.AbstractMessageWriter {
      port;
      errorCount;
      constructor(port) {
        super();
        this.port = port;
        this.errorCount = 0;
        port.on("close", () => this.fireClose());
        port.on("error", (error) => this.fireError(error));
      }
      write(msg) {
        try {
          this.port.postMessage(msg);
          return Promise.resolve();
        } catch (error) {
          this.handleError(error, msg);
          return Promise.reject(error);
        }
      }
      handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
      }
      end() {
      }
    };
    exports2.PortMessageWriter = PortMessageWriter;
    var SocketMessageReader = class extends api_1.ReadableStreamMessageReader {
      constructor(socket, encoding = "utf-8") {
        super((0, ril_1.default)().stream.asReadableStream(socket), encoding);
      }
    };
    exports2.SocketMessageReader = SocketMessageReader;
    var SocketMessageWriter = class extends api_1.WriteableStreamMessageWriter {
      socket;
      constructor(socket, options) {
        super((0, ril_1.default)().stream.asWritableStream(socket), options);
        this.socket = socket;
      }
      dispose() {
        super.dispose();
        this.socket.destroy();
      }
    };
    exports2.SocketMessageWriter = SocketMessageWriter;
    var StreamMessageReader = class extends api_1.ReadableStreamMessageReader {
      constructor(readable, encoding) {
        super((0, ril_1.default)().stream.asReadableStream(readable), encoding);
      }
    };
    exports2.StreamMessageReader = StreamMessageReader;
    var StreamMessageWriter = class extends api_1.WriteableStreamMessageWriter {
      constructor(writable, options) {
        super((0, ril_1.default)().stream.asWritableStream(writable), options);
      }
    };
    exports2.StreamMessageWriter = StreamMessageWriter;
    var XDG_RUNTIME_DIR = process.env["XDG_RUNTIME_DIR"];
    var safeIpcPathLengths = /* @__PURE__ */ new Map([
      ["linux", 107],
      ["darwin", 102]
    ]);
    function generateRandomPipeName() {
      if (process.platform === "win32") {
        return `\\\\.\\pipe\\lsp-${(0, crypto_1.randomBytes)(16).toString("hex")}-sock`;
      }
      let randomLength = 32;
      const fixedLength = "/lsp-.sock".length;
      const tmpDir = fs.realpathSync(XDG_RUNTIME_DIR ?? os.tmpdir());
      const limit = safeIpcPathLengths.get(process.platform);
      if (limit !== void 0) {
        randomLength = Math.min(limit - tmpDir.length - fixedLength, randomLength);
      }
      if (randomLength < 16) {
        throw new Error(`Unable to generate a random pipe name with ${randomLength} characters.`);
      }
      const randomSuffix = (0, crypto_1.randomBytes)(Math.floor(randomLength / 2)).toString("hex");
      return path.join(tmpDir, `lsp-${randomSuffix}.sock`);
    }
    function createClientPipeTransport(pipeName, encoding = "utf-8") {
      let connectResolve;
      const connected = new Promise((resolve2, _reject) => {
        connectResolve = resolve2;
      });
      return new Promise((resolve2, reject) => {
        const server = (0, net_1.createServer)((socket) => {
          server.close();
          connectResolve([
            new SocketMessageReader(socket, encoding),
            new SocketMessageWriter(socket, encoding)
          ]);
        });
        server.on("error", reject);
        server.listen(pipeName, () => {
          server.removeListener("error", reject);
          resolve2({
            onConnected: () => {
              return connected;
            }
          });
        });
      });
    }
    function createServerPipeTransport(pipeName, encoding = "utf-8") {
      const socket = (0, net_1.createConnection)(pipeName);
      return [
        new SocketMessageReader(socket, encoding),
        new SocketMessageWriter(socket, encoding)
      ];
    }
    function createClientSocketTransport(port, encoding = "utf-8") {
      let connectResolve;
      const connected = new Promise((resolve2, _reject) => {
        connectResolve = resolve2;
      });
      return new Promise((resolve2, reject) => {
        const server = (0, net_1.createServer)((socket) => {
          server.close();
          connectResolve([
            new SocketMessageReader(socket, encoding),
            new SocketMessageWriter(socket, encoding)
          ]);
        });
        server.on("error", reject);
        server.listen(port, "127.0.0.1", () => {
          server.removeListener("error", reject);
          const address = server.address();
          if (address === null || typeof address === "string") {
            reject(new Error(`Unexpected server address: ${address}`));
            return;
          }
          const boundPort = address.port;
          resolve2({
            port: () => boundPort,
            onConnected: () => {
              return connected;
            }
          });
        });
      });
    }
    function createServerSocketTransport(port, encoding = "utf-8") {
      const socket = (0, net_1.createConnection)(port, "127.0.0.1");
      return [
        new SocketMessageReader(socket, encoding),
        new SocketMessageWriter(socket, encoding)
      ];
    }
    function isReadableStream(value) {
      const candidate = value;
      return candidate.read !== void 0 && candidate.addListener !== void 0;
    }
    function isWritableStream(value) {
      const candidate = value;
      return candidate.write !== void 0 && candidate.addListener !== void 0;
    }
    function createMessageConnection(input, output, logger, options) {
      if (!logger) {
        logger = api_1.NullLogger;
      }
      const reader = isReadableStream(input) ? new StreamMessageReader(input) : input;
      const writer = isWritableStream(output) ? new StreamMessageWriter(output) : output;
      if (api_1.ConnectionStrategy.is(options)) {
        options = { connectionStrategy: options };
      }
      return (0, api_1.createMessageConnection)(reader, writer, logger, options);
    }
  }
});

// ../node_modules/vscode-languageserver-protocol/lib/node/main.js
var require_main2 = __commonJS({
  "../node_modules/vscode-languageserver-protocol/lib/node/main.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createProtocolConnection = createProtocolConnection;
    var node_1 = require_main();
    __exportStar(require_main(), exports2);
    __exportStar(require_api2(), exports2);
    function createProtocolConnection(input, output, logger, options) {
      return (0, node_1.createMessageConnection)(input, output, logger, options);
    }
  }
});

// ../node_modules/vscode-languageserver/lib/common/api.js
var require_api3 = __commonJS({
  "../node_modules/vscode-languageserver/lib/common/api.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProposedFeatures = exports2.NotebookDocuments = exports2.TextDocuments = exports2.SemanticTokensBuilder = exports2.WorkDoneProgressReporter = void 0;
    var semanticTokens_1 = require_semanticTokens();
    Object.defineProperty(exports2, "SemanticTokensBuilder", { enumerable: true, get: function() {
      return semanticTokens_1.SemanticTokensBuilder;
    } });
    var progress_1 = require_progress();
    Object.defineProperty(exports2, "WorkDoneProgressReporter", { enumerable: true, get: function() {
      return progress_1.WorkDoneProgressReporter;
    } });
    __exportStar(require_api2(), exports2);
    var textDocuments_1 = require_textDocuments();
    Object.defineProperty(exports2, "TextDocuments", { enumerable: true, get: function() {
      return textDocuments_1.TextDocuments;
    } });
    var notebook_1 = require_notebook();
    Object.defineProperty(exports2, "NotebookDocuments", { enumerable: true, get: function() {
      return notebook_1.NotebookDocuments;
    } });
    __exportStar(require_server(), exports2);
    var ProposedFeatures2;
    (function(ProposedFeatures3) {
      ProposedFeatures3.all = {
        __brand: "features"
      };
    })(ProposedFeatures2 || (exports2.ProposedFeatures = ProposedFeatures2 = {}));
  }
});

// ../node_modules/vscode-languageserver/lib/node/main.js
var require_main3 = __commonJS({
  "../node_modules/vscode-languageserver/lib/node/main.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o2, k2, desc);
    }) : (function(o2, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o2[k2] = m2[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o2) {
        ownKeys = Object.getOwnPropertyNames || function(o3) {
          var ar = [];
          for (var k in o3) if (Object.prototype.hasOwnProperty.call(o3, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o2);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Files = void 0;
    exports2.createConnection = createConnection2;
    var node_util_1 = require("util");
    var Is2 = __importStar(require_is());
    var server_1 = require_server();
    var fm = __importStar(require_files());
    var node_1 = require_main2();
    __exportStar(require_main2(), exports2);
    __exportStar(require_api3(), exports2);
    var Files;
    (function(Files2) {
      Files2.uriToFilePath = fm.uriToFilePath;
      Files2.resolveGlobalNodePath = fm.resolveGlobalNodePath;
      Files2.resolveGlobalYarnPath = fm.resolveGlobalYarnPath;
      Files2.resolve = fm.resolve;
      Files2.resolveModulePath = fm.resolveModulePath;
    })(Files || (exports2.Files = Files = {}));
    var _protocolConnection;
    function endProtocolConnection() {
      if (_protocolConnection === void 0) {
        return;
      }
      try {
        _protocolConnection.end();
      } catch (_err) {
      }
    }
    var _shutdownReceived = false;
    var exitTimer = void 0;
    function setupExitTimer() {
      const argName = "--clientProcessId";
      function runTimer(value) {
        try {
          const processId = parseInt(value);
          if (!isNaN(processId)) {
            exitTimer = setInterval(() => {
              try {
                process.kill(processId, 0);
              } catch (ex) {
                endProtocolConnection();
                process.exit(_shutdownReceived ? 0 : 1);
              }
            }, 3e3);
          }
        } catch (e2) {
        }
      }
      for (let i2 = 2; i2 < process.argv.length; i2++) {
        const arg = process.argv[i2];
        if (arg === argName && i2 + 1 < process.argv.length) {
          runTimer(process.argv[i2 + 1]);
          return;
        } else {
          const args = arg.split("=");
          if (args[0] === argName) {
            runTimer(args[1]);
          }
        }
      }
    }
    setupExitTimer();
    var watchDog = {
      initialize: (params) => {
        const processId = params.processId;
        if (Is2.number(processId) && exitTimer === void 0) {
          setInterval(() => {
            try {
              process.kill(processId, 0);
            } catch (ex) {
              process.exit(_shutdownReceived ? 0 : 1);
            }
          }, 3e3);
        }
      },
      get shutdownReceived() {
        return _shutdownReceived;
      },
      set shutdownReceived(value) {
        _shutdownReceived = value;
      },
      exit: (code) => {
        endProtocolConnection();
        process.exit(code);
      }
    };
    function createConnection2(arg1, arg2, arg3, arg4) {
      let factories;
      let input;
      let output;
      let options;
      if (arg1 !== void 0 && arg1.__brand === "features") {
        factories = arg1;
        arg1 = arg2;
        arg2 = arg3;
        arg3 = arg4;
      }
      if (node_1.ConnectionStrategy.is(arg1) || node_1.ConnectionOptions.is(arg1)) {
        options = arg1;
      } else {
        input = arg1;
        output = arg2;
        options = arg3;
      }
      return _createConnection(input, output, options, factories);
    }
    function _createConnection(input, output, options, factories) {
      let stdio = false;
      if (!input && !output && process.argv.length > 2) {
        let port = void 0;
        let pipeName = void 0;
        const argv = process.argv.slice(2);
        for (let i2 = 0; i2 < argv.length; i2++) {
          const arg = argv[i2];
          if (arg === "--node-ipc") {
            input = new node_1.IPCMessageReader(process);
            output = new node_1.IPCMessageWriter(process);
            break;
          } else if (arg === "--stdio") {
            stdio = true;
            input = process.stdin;
            output = process.stdout;
            break;
          } else if (arg === "--socket") {
            port = parseInt(argv[i2 + 1]);
            break;
          } else if (arg === "--pipe") {
            pipeName = argv[i2 + 1];
            break;
          } else {
            const args = arg.split("=");
            if (args[0] === "--socket") {
              port = parseInt(args[1]);
              break;
            } else if (args[0] === "--pipe") {
              pipeName = args[1];
              break;
            }
          }
        }
        if (port) {
          const transport = (0, node_1.createServerSocketTransport)(port);
          input = transport[0];
          output = transport[1];
        } else if (pipeName) {
          const transport = (0, node_1.createServerPipeTransport)(pipeName);
          input = transport[0];
          output = transport[1];
        }
      }
      const commandLineMessage = "Use arguments of createConnection or set command line parameters: '--node-ipc', '--stdio' or '--socket={number}'";
      if (!input) {
        throw new Error("Connection input stream is not set. " + commandLineMessage);
      }
      if (!output) {
        throw new Error("Connection output stream is not set. " + commandLineMessage);
      }
      if (Is2.func(input.read) && Is2.func(input.on)) {
        const inputStream = input;
        inputStream.on("end", () => {
          endProtocolConnection();
          process.exit(_shutdownReceived ? 0 : 1);
        });
        inputStream.on("close", () => {
          endProtocolConnection();
          process.exit(_shutdownReceived ? 0 : 1);
        });
      }
      const connectionFactory = (logger) => {
        const result = (0, node_1.createProtocolConnection)(input, output, logger, options);
        if (stdio) {
          patchConsole(logger);
        }
        return result;
      };
      return (0, server_1.createConnection)(connectionFactory, watchDog, factories);
    }
    function patchConsole(logger) {
      function serialize(args) {
        return args.map((arg) => typeof arg === "string" ? arg : (0, node_util_1.inspect)(arg)).join(" ");
      }
      const counters = /* @__PURE__ */ new Map();
      console.assert = function assert(assertion, ...args) {
        if (assertion) {
          return;
        }
        if (args.length === 0) {
          logger.error("Assertion failed");
        } else {
          const [message, ...rest] = args;
          logger.error(`Assertion failed: ${message} ${serialize(rest)}`);
        }
      };
      console.count = function count(label = "default") {
        const message = String(label);
        let counter = counters.get(message) ?? 0;
        counter += 1;
        counters.set(message, counter);
        logger.log(`${message}: ${message}`);
      };
      console.countReset = function countReset(label) {
        if (label === void 0) {
          counters.clear();
        } else {
          counters.delete(String(label));
        }
      };
      console.debug = function debug(...args) {
        logger.log(serialize(args));
      };
      console.dir = function dir(arg, options) {
        logger.log((0, node_util_1.inspect)(arg, options));
      };
      console.log = function log(...args) {
        logger.log(serialize(args));
      };
      console.error = function error(...args) {
        logger.error(serialize(args));
      };
      console.trace = function trace(...args) {
        const stack = new Error().stack.replace(/(.+\n){2}/, "");
        let message = "Trace";
        if (args.length !== 0) {
          message += `: ${serialize(args)}`;
        }
        logger.log(`${message}
${stack}`);
      };
      console.warn = function warn(...args) {
        logger.warn(serialize(args));
      };
      console.info = function info(...args) {
        logger.info(serialize(args));
      };
    }
  }
});

// ../node_modules/fast-glob/out/utils/array.js
var require_array = __commonJS({
  "../node_modules/fast-glob/out/utils/array.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.splitWhen = exports2.flatten = void 0;
    function flatten(items) {
      return items.reduce((collection, item) => [].concat(collection, item), []);
    }
    exports2.flatten = flatten;
    function splitWhen(items, predicate) {
      const result = [[]];
      let groupIndex = 0;
      for (const item of items) {
        if (predicate(item)) {
          groupIndex++;
          result[groupIndex] = [];
        } else {
          result[groupIndex].push(item);
        }
      }
      return result;
    }
    exports2.splitWhen = splitWhen;
  }
});

// ../node_modules/fast-glob/out/utils/errno.js
var require_errno = __commonJS({
  "../node_modules/fast-glob/out/utils/errno.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isEnoentCodeError = void 0;
    function isEnoentCodeError(error) {
      return error.code === "ENOENT";
    }
    exports2.isEnoentCodeError = isEnoentCodeError;
  }
});

// ../node_modules/fast-glob/out/utils/fs.js
var require_fs = __commonJS({
  "../node_modules/fast-glob/out/utils/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createDirentFromStats = void 0;
    var DirentFromStats = class {
      constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
      }
    };
    function createDirentFromStats(name, stats) {
      return new DirentFromStats(name, stats);
    }
    exports2.createDirentFromStats = createDirentFromStats;
  }
});

// ../node_modules/fast-glob/out/utils/path.js
var require_path = __commonJS({
  "../node_modules/fast-glob/out/utils/path.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.convertPosixPathToPattern = exports2.convertWindowsPathToPattern = exports2.convertPathToPattern = exports2.escapePosixPath = exports2.escapeWindowsPath = exports2.escape = exports2.removeLeadingDotSegment = exports2.makeAbsolute = exports2.unixify = void 0;
    var os = require("os");
    var path = require("path");
    var IS_WINDOWS_PLATFORM = os.platform() === "win32";
    var LEADING_DOT_SEGMENT_CHARACTERS_COUNT = 2;
    var POSIX_UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\()|\\(?![!()*+?@[\]{|}]))/g;
    var WINDOWS_UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()[\]{}]|^!|[!+@](?=\())/g;
    var DOS_DEVICE_PATH_RE = /^\\\\([.?])/;
    var WINDOWS_BACKSLASHES_RE = /\\(?![!()+@[\]{}])/g;
    function unixify(filepath) {
      return filepath.replace(/\\/g, "/");
    }
    exports2.unixify = unixify;
    function makeAbsolute(cwd, filepath) {
      return path.resolve(cwd, filepath);
    }
    exports2.makeAbsolute = makeAbsolute;
    function removeLeadingDotSegment(entry) {
      if (entry.charAt(0) === ".") {
        const secondCharactery = entry.charAt(1);
        if (secondCharactery === "/" || secondCharactery === "\\") {
          return entry.slice(LEADING_DOT_SEGMENT_CHARACTERS_COUNT);
        }
      }
      return entry;
    }
    exports2.removeLeadingDotSegment = removeLeadingDotSegment;
    exports2.escape = IS_WINDOWS_PLATFORM ? escapeWindowsPath : escapePosixPath;
    function escapeWindowsPath(pattern) {
      return pattern.replace(WINDOWS_UNESCAPED_GLOB_SYMBOLS_RE, "\\$2");
    }
    exports2.escapeWindowsPath = escapeWindowsPath;
    function escapePosixPath(pattern) {
      return pattern.replace(POSIX_UNESCAPED_GLOB_SYMBOLS_RE, "\\$2");
    }
    exports2.escapePosixPath = escapePosixPath;
    exports2.convertPathToPattern = IS_WINDOWS_PLATFORM ? convertWindowsPathToPattern : convertPosixPathToPattern;
    function convertWindowsPathToPattern(filepath) {
      return escapeWindowsPath(filepath).replace(DOS_DEVICE_PATH_RE, "//$1").replace(WINDOWS_BACKSLASHES_RE, "/");
    }
    exports2.convertWindowsPathToPattern = convertWindowsPathToPattern;
    function convertPosixPathToPattern(filepath) {
      return escapePosixPath(filepath);
    }
    exports2.convertPosixPathToPattern = convertPosixPathToPattern;
  }
});

// ../node_modules/is-extglob/index.js
var require_is_extglob = __commonJS({
  "../node_modules/is-extglob/index.js"(exports2, module2) {
    module2.exports = function isExtglob(str) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      var match;
      while (match = /(\\).|([@?!+*]\(.*\))/g.exec(str)) {
        if (match[2]) return true;
        str = str.slice(match.index + match[0].length);
      }
      return false;
    };
  }
});

// ../node_modules/is-glob/index.js
var require_is_glob = __commonJS({
  "../node_modules/is-glob/index.js"(exports2, module2) {
    var isExtglob = require_is_extglob();
    var chars = { "{": "}", "(": ")", "[": "]" };
    var strictCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      var pipeIndex = -2;
      var closeSquareIndex = -2;
      var closeCurlyIndex = -2;
      var closeParenIndex = -2;
      var backSlashIndex = -2;
      while (index < str.length) {
        if (str[index] === "*") {
          return true;
        }
        if (str[index + 1] === "?" && /[\].+)]/.test(str[index])) {
          return true;
        }
        if (closeSquareIndex !== -1 && str[index] === "[" && str[index + 1] !== "]") {
          if (closeSquareIndex < index) {
            closeSquareIndex = str.indexOf("]", index);
          }
          if (closeSquareIndex > index) {
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
          }
        }
        if (closeCurlyIndex !== -1 && str[index] === "{" && str[index + 1] !== "}") {
          closeCurlyIndex = str.indexOf("}", index);
          if (closeCurlyIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeCurlyIndex) {
              return true;
            }
          }
        }
        if (closeParenIndex !== -1 && str[index] === "(" && str[index + 1] === "?" && /[:!=]/.test(str[index + 2]) && str[index + 3] !== ")") {
          closeParenIndex = str.indexOf(")", index);
          if (closeParenIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
              return true;
            }
          }
        }
        if (pipeIndex !== -1 && str[index] === "(" && str[index + 1] !== "|") {
          if (pipeIndex < index) {
            pipeIndex = str.indexOf("|", index);
          }
          if (pipeIndex !== -1 && str[pipeIndex + 1] !== ")") {
            closeParenIndex = str.indexOf(")", pipeIndex);
            if (closeParenIndex > pipeIndex) {
              backSlashIndex = str.indexOf("\\", pipeIndex);
              if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
                return true;
              }
            }
          }
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n2 = str.indexOf(close, index);
            if (n2 !== -1) {
              index = n2 + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    var relaxedCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      while (index < str.length) {
        if (/[*?{}()[\]]/.test(str[index])) {
          return true;
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n2 = str.indexOf(close, index);
            if (n2 !== -1) {
              index = n2 + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    module2.exports = function isGlob(str, options) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      if (isExtglob(str)) {
        return true;
      }
      var check = strictCheck;
      if (options && options.strict === false) {
        check = relaxedCheck;
      }
      return check(str);
    };
  }
});

// ../node_modules/glob-parent/index.js
var require_glob_parent = __commonJS({
  "../node_modules/glob-parent/index.js"(exports2, module2) {
    "use strict";
    var isGlob = require_is_glob();
    var pathPosixDirname = require("path").posix.dirname;
    var isWin32 = require("os").platform() === "win32";
    var slash = "/";
    var backslash = /\\/g;
    var enclosure = /[\{\[].*[\}\]]$/;
    var globby = /(^|[^\\])([\{\[]|\([^\)]+$)/;
    var escaped = /\\([\!\*\?\|\[\]\(\)\{\}])/g;
    module2.exports = function globParent(str, opts) {
      var options = Object.assign({ flipBackslashes: true }, opts);
      if (options.flipBackslashes && isWin32 && str.indexOf(slash) < 0) {
        str = str.replace(backslash, slash);
      }
      if (enclosure.test(str)) {
        str += slash;
      }
      str += "a";
      do {
        str = pathPosixDirname(str);
      } while (isGlob(str) || globby.test(str));
      return str.replace(escaped, "$1");
    };
  }
});

// ../node_modules/braces/lib/utils.js
var require_utils = __commonJS({
  "../node_modules/braces/lib/utils.js"(exports2) {
    "use strict";
    exports2.isInteger = (num) => {
      if (typeof num === "number") {
        return Number.isInteger(num);
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isInteger(Number(num));
      }
      return false;
    };
    exports2.find = (node, type) => node.nodes.find((node2) => node2.type === type);
    exports2.exceedsLimit = (min, max, step = 1, limit) => {
      if (limit === false) return false;
      if (!exports2.isInteger(min) || !exports2.isInteger(max)) return false;
      return (Number(max) - Number(min)) / Number(step) >= limit;
    };
    exports2.escapeNode = (block, n2 = 0, type) => {
      const node = block.nodes[n2];
      if (!node) return;
      if (type && node.type === type || node.type === "open" || node.type === "close") {
        if (node.escaped !== true) {
          node.value = "\\" + node.value;
          node.escaped = true;
        }
      }
    };
    exports2.encloseBrace = (node) => {
      if (node.type !== "brace") return false;
      if (node.commas >> 0 + node.ranges >> 0 === 0) {
        node.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isInvalidBrace = (block) => {
      if (block.type !== "brace") return false;
      if (block.invalid === true || block.dollar) return true;
      if (block.commas >> 0 + block.ranges >> 0 === 0) {
        block.invalid = true;
        return true;
      }
      if (block.open !== true || block.close !== true) {
        block.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isOpenOrClose = (node) => {
      if (node.type === "open" || node.type === "close") {
        return true;
      }
      return node.open === true || node.close === true;
    };
    exports2.reduce = (nodes) => nodes.reduce((acc, node) => {
      if (node.type === "text") acc.push(node.value);
      if (node.type === "range") node.type = "text";
      return acc;
    }, []);
    exports2.flatten = (...args) => {
      const result = [];
      const flat = (arr) => {
        for (let i2 = 0; i2 < arr.length; i2++) {
          const ele = arr[i2];
          if (Array.isArray(ele)) {
            flat(ele);
            continue;
          }
          if (ele !== void 0) {
            result.push(ele);
          }
        }
        return result;
      };
      flat(args);
      return result;
    };
  }
});

// ../node_modules/braces/lib/stringify.js
var require_stringify = __commonJS({
  "../node_modules/braces/lib/stringify.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = (ast, options = {}) => {
      const stringify = (node, parent = {}) => {
        const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options.escapeInvalid === true;
        let output = "";
        if (node.value) {
          if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
            return "\\" + node.value;
          }
          return node.value;
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += stringify(child);
          }
        }
        return output;
      };
      return stringify(ast);
    };
  }
});

// ../node_modules/is-number/index.js
var require_is_number = __commonJS({
  "../node_modules/is-number/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function(num) {
      if (typeof num === "number") {
        return num - num === 0;
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
      }
      return false;
    };
  }
});

// ../node_modules/to-regex-range/index.js
var require_to_regex_range = __commonJS({
  "../node_modules/to-regex-range/index.js"(exports2, module2) {
    "use strict";
    var isNumber = require_is_number();
    var toRegexRange = (min, max, options) => {
      if (isNumber(min) === false) {
        throw new TypeError("toRegexRange: expected the first argument to be a number");
      }
      if (max === void 0 || min === max) {
        return String(min);
      }
      if (isNumber(max) === false) {
        throw new TypeError("toRegexRange: expected the second argument to be a number.");
      }
      let opts = { relaxZeros: true, ...options };
      if (typeof opts.strictZeros === "boolean") {
        opts.relaxZeros = opts.strictZeros === false;
      }
      let relax = String(opts.relaxZeros);
      let shorthand = String(opts.shorthand);
      let capture = String(opts.capture);
      let wrap = String(opts.wrap);
      let cacheKey = min + ":" + max + "=" + relax + shorthand + capture + wrap;
      if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
        return toRegexRange.cache[cacheKey].result;
      }
      let a2 = Math.min(min, max);
      let b2 = Math.max(min, max);
      if (Math.abs(a2 - b2) === 1) {
        let result = min + "|" + max;
        if (opts.capture) {
          return `(${result})`;
        }
        if (opts.wrap === false) {
          return result;
        }
        return `(?:${result})`;
      }
      let isPadded = hasPadding(min) || hasPadding(max);
      let state = { min, max, a: a2, b: b2 };
      let positives = [];
      let negatives = [];
      if (isPadded) {
        state.isPadded = isPadded;
        state.maxLen = String(state.max).length;
      }
      if (a2 < 0) {
        let newMin = b2 < 0 ? Math.abs(b2) : 1;
        negatives = splitToPatterns(newMin, Math.abs(a2), state, opts);
        a2 = state.a = 0;
      }
      if (b2 >= 0) {
        positives = splitToPatterns(a2, b2, state, opts);
      }
      state.negatives = negatives;
      state.positives = positives;
      state.result = collatePatterns(negatives, positives, opts);
      if (opts.capture === true) {
        state.result = `(${state.result})`;
      } else if (opts.wrap !== false && positives.length + negatives.length > 1) {
        state.result = `(?:${state.result})`;
      }
      toRegexRange.cache[cacheKey] = state;
      return state.result;
    };
    function collatePatterns(neg, pos, options) {
      let onlyNegative = filterPatterns(neg, pos, "-", false, options) || [];
      let onlyPositive = filterPatterns(pos, neg, "", false, options) || [];
      let intersected = filterPatterns(neg, pos, "-?", true, options) || [];
      let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
      return subpatterns.join("|");
    }
    function splitToRanges(min, max) {
      let nines = 1;
      let zeros = 1;
      let stop = countNines(min, nines);
      let stops = /* @__PURE__ */ new Set([max]);
      while (min <= stop && stop <= max) {
        stops.add(stop);
        nines += 1;
        stop = countNines(min, nines);
      }
      stop = countZeros(max + 1, zeros) - 1;
      while (min < stop && stop <= max) {
        stops.add(stop);
        zeros += 1;
        stop = countZeros(max + 1, zeros) - 1;
      }
      stops = [...stops];
      stops.sort(compare);
      return stops;
    }
    function rangeToPattern(start, stop, options) {
      if (start === stop) {
        return { pattern: start, count: [], digits: 0 };
      }
      let zipped = zip(start, stop);
      let digits = zipped.length;
      let pattern = "";
      let count = 0;
      for (let i2 = 0; i2 < digits; i2++) {
        let [startDigit, stopDigit] = zipped[i2];
        if (startDigit === stopDigit) {
          pattern += startDigit;
        } else if (startDigit !== "0" || stopDigit !== "9") {
          pattern += toCharacterClass(startDigit, stopDigit, options);
        } else {
          count++;
        }
      }
      if (count) {
        pattern += options.shorthand === true ? "\\d" : "[0-9]";
      }
      return { pattern, count: [count], digits };
    }
    function splitToPatterns(min, max, tok, options) {
      let ranges = splitToRanges(min, max);
      let tokens = [];
      let start = min;
      let prev;
      for (let i2 = 0; i2 < ranges.length; i2++) {
        let max2 = ranges[i2];
        let obj = rangeToPattern(String(start), String(max2), options);
        let zeros = "";
        if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
          if (prev.count.length > 1) {
            prev.count.pop();
          }
          prev.count.push(obj.count[0]);
          prev.string = prev.pattern + toQuantifier(prev.count);
          start = max2 + 1;
          continue;
        }
        if (tok.isPadded) {
          zeros = padZeros(max2, tok, options);
        }
        obj.string = zeros + obj.pattern + toQuantifier(obj.count);
        tokens.push(obj);
        start = max2 + 1;
        prev = obj;
      }
      return tokens;
    }
    function filterPatterns(arr, comparison, prefix, intersection, options) {
      let result = [];
      for (let ele of arr) {
        let { string } = ele;
        if (!intersection && !contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
        if (intersection && contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
      }
      return result;
    }
    function zip(a2, b2) {
      let arr = [];
      for (let i2 = 0; i2 < a2.length; i2++) arr.push([a2[i2], b2[i2]]);
      return arr;
    }
    function compare(a2, b2) {
      return a2 > b2 ? 1 : b2 > a2 ? -1 : 0;
    }
    function contains(arr, key, val) {
      return arr.some((ele) => ele[key] === val);
    }
    function countNines(min, len) {
      return Number(String(min).slice(0, -len) + "9".repeat(len));
    }
    function countZeros(integer2, zeros) {
      return integer2 - integer2 % Math.pow(10, zeros);
    }
    function toQuantifier(digits) {
      let [start = 0, stop = ""] = digits;
      if (stop || start > 1) {
        return `{${start + (stop ? "," + stop : "")}}`;
      }
      return "";
    }
    function toCharacterClass(a2, b2, options) {
      return `[${a2}${b2 - a2 === 1 ? "" : "-"}${b2}]`;
    }
    function hasPadding(str) {
      return /^-?(0+)\d/.test(str);
    }
    function padZeros(value, tok, options) {
      if (!tok.isPadded) {
        return value;
      }
      let diff = Math.abs(tok.maxLen - String(value).length);
      let relax = options.relaxZeros !== false;
      switch (diff) {
        case 0:
          return "";
        case 1:
          return relax ? "0?" : "0";
        case 2:
          return relax ? "0{0,2}" : "00";
        default: {
          return relax ? `0{0,${diff}}` : `0{${diff}}`;
        }
      }
    }
    toRegexRange.cache = {};
    toRegexRange.clearCache = () => toRegexRange.cache = {};
    module2.exports = toRegexRange;
  }
});

// ../node_modules/fill-range/index.js
var require_fill_range = __commonJS({
  "../node_modules/fill-range/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var toRegexRange = require_to_regex_range();
    var isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    var transform = (toNumber) => {
      return (value) => toNumber === true ? Number(value) : String(value);
    };
    var isValidValue = (value) => {
      return typeof value === "number" || typeof value === "string" && value !== "";
    };
    var isNumber = (num) => Number.isInteger(+num);
    var zeros = (input) => {
      let value = `${input}`;
      let index = -1;
      if (value[0] === "-") value = value.slice(1);
      if (value === "0") return false;
      while (value[++index] === "0") ;
      return index > 0;
    };
    var stringify = (start, end, options) => {
      if (typeof start === "string" || typeof end === "string") {
        return true;
      }
      return options.stringify === true;
    };
    var pad = (input, maxLength, toNumber) => {
      if (maxLength > 0) {
        let dash = input[0] === "-" ? "-" : "";
        if (dash) input = input.slice(1);
        input = dash + input.padStart(dash ? maxLength - 1 : maxLength, "0");
      }
      if (toNumber === false) {
        return String(input);
      }
      return input;
    };
    var toMaxLen = (input, maxLength) => {
      let negative = input[0] === "-" ? "-" : "";
      if (negative) {
        input = input.slice(1);
        maxLength--;
      }
      while (input.length < maxLength) input = "0" + input;
      return negative ? "-" + input : input;
    };
    var toSequence = (parts, options, maxLen) => {
      parts.negatives.sort((a2, b2) => a2 < b2 ? -1 : a2 > b2 ? 1 : 0);
      parts.positives.sort((a2, b2) => a2 < b2 ? -1 : a2 > b2 ? 1 : 0);
      let prefix = options.capture ? "" : "?:";
      let positives = "";
      let negatives = "";
      let result;
      if (parts.positives.length) {
        positives = parts.positives.map((v2) => toMaxLen(String(v2), maxLen)).join("|");
      }
      if (parts.negatives.length) {
        negatives = `-(${prefix}${parts.negatives.map((v2) => toMaxLen(String(v2), maxLen)).join("|")})`;
      }
      if (positives && negatives) {
        result = `${positives}|${negatives}`;
      } else {
        result = positives || negatives;
      }
      if (options.wrap) {
        return `(${prefix}${result})`;
      }
      return result;
    };
    var toRange = (a2, b2, isNumbers, options) => {
      if (isNumbers) {
        return toRegexRange(a2, b2, { wrap: false, ...options });
      }
      let start = String.fromCharCode(a2);
      if (a2 === b2) return start;
      let stop = String.fromCharCode(b2);
      return `[${start}-${stop}]`;
    };
    var toRegex = (start, end, options) => {
      if (Array.isArray(start)) {
        let wrap = options.wrap === true;
        let prefix = options.capture ? "" : "?:";
        return wrap ? `(${prefix}${start.join("|")})` : start.join("|");
      }
      return toRegexRange(start, end, options);
    };
    var rangeError = (...args) => {
      return new RangeError("Invalid range arguments: " + util.inspect(...args));
    };
    var invalidRange = (start, end, options) => {
      if (options.strictRanges === true) throw rangeError([start, end]);
      return [];
    };
    var invalidStep = (step, options) => {
      if (options.strictRanges === true) {
        throw new TypeError(`Expected step "${step}" to be a number`);
      }
      return [];
    };
    var fillNumbers = (start, end, step = 1, options = {}) => {
      let a2 = Number(start);
      let b2 = Number(end);
      if (!Number.isInteger(a2) || !Number.isInteger(b2)) {
        if (options.strictRanges === true) throw rangeError([start, end]);
        return [];
      }
      if (a2 === 0) a2 = 0;
      if (b2 === 0) b2 = 0;
      let descending = a2 > b2;
      let startString = String(start);
      let endString = String(end);
      let stepString = String(step);
      step = Math.max(Math.abs(step), 1);
      let padded = zeros(startString) || zeros(endString) || zeros(stepString);
      let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
      let toNumber = padded === false && stringify(start, end, options) === false;
      let format = options.transform || transform(toNumber);
      if (options.toRegex && step === 1) {
        return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
      }
      let parts = { negatives: [], positives: [] };
      let push = (num) => parts[num < 0 ? "negatives" : "positives"].push(Math.abs(num));
      let range = [];
      let index = 0;
      while (descending ? a2 >= b2 : a2 <= b2) {
        if (options.toRegex === true && step > 1) {
          push(a2);
        } else {
          range.push(pad(format(a2, index), maxLen, toNumber));
        }
        a2 = descending ? a2 - step : a2 + step;
        index++;
      }
      if (options.toRegex === true) {
        return step > 1 ? toSequence(parts, options, maxLen) : toRegex(range, null, { wrap: false, ...options });
      }
      return range;
    };
    var fillLetters = (start, end, step = 1, options = {}) => {
      if (!isNumber(start) && start.length > 1 || !isNumber(end) && end.length > 1) {
        return invalidRange(start, end, options);
      }
      let format = options.transform || ((val) => String.fromCharCode(val));
      let a2 = `${start}`.charCodeAt(0);
      let b2 = `${end}`.charCodeAt(0);
      let descending = a2 > b2;
      let min = Math.min(a2, b2);
      let max = Math.max(a2, b2);
      if (options.toRegex && step === 1) {
        return toRange(min, max, false, options);
      }
      let range = [];
      let index = 0;
      while (descending ? a2 >= b2 : a2 <= b2) {
        range.push(format(a2, index));
        a2 = descending ? a2 - step : a2 + step;
        index++;
      }
      if (options.toRegex === true) {
        return toRegex(range, null, { wrap: false, options });
      }
      return range;
    };
    var fill = (start, end, step, options = {}) => {
      if (end == null && isValidValue(start)) {
        return [start];
      }
      if (!isValidValue(start) || !isValidValue(end)) {
        return invalidRange(start, end, options);
      }
      if (typeof step === "function") {
        return fill(start, end, 1, { transform: step });
      }
      if (isObject(step)) {
        return fill(start, end, 0, step);
      }
      let opts = { ...options };
      if (opts.capture === true) opts.wrap = true;
      step = step || opts.step || 1;
      if (!isNumber(step)) {
        if (step != null && !isObject(step)) return invalidStep(step, opts);
        return fill(start, end, 1, step);
      }
      if (isNumber(start) && isNumber(end)) {
        return fillNumbers(start, end, step, opts);
      }
      return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
    };
    module2.exports = fill;
  }
});

// ../node_modules/braces/lib/compile.js
var require_compile = __commonJS({
  "../node_modules/braces/lib/compile.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var utils = require_utils();
    var compile2 = (ast, options = {}) => {
      const walk = (node, parent = {}) => {
        const invalidBlock = utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options.escapeInvalid === true;
        const invalid = invalidBlock === true || invalidNode === true;
        const prefix = options.escapeInvalid === true ? "\\" : "";
        let output = "";
        if (node.isOpen === true) {
          return prefix + node.value;
        }
        if (node.isClose === true) {
          console.log("node.isClose", prefix, node.value);
          return prefix + node.value;
        }
        if (node.type === "open") {
          return invalid ? prefix + node.value : "(";
        }
        if (node.type === "close") {
          return invalid ? prefix + node.value : ")";
        }
        if (node.type === "comma") {
          return node.prev.type === "comma" ? "" : invalid ? node.value : "|";
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          const range = fill(...args, { ...options, wrap: false, toRegex: true, strictZeros: true });
          if (range.length !== 0) {
            return args.length > 1 && range.length > 1 ? `(${range})` : range;
          }
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += walk(child, node);
          }
        }
        return output;
      };
      return walk(ast);
    };
    module2.exports = compile2;
  }
});

// ../node_modules/braces/lib/expand.js
var require_expand = __commonJS({
  "../node_modules/braces/lib/expand.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var stringify = require_stringify();
    var utils = require_utils();
    var append = (queue = "", stash = "", enclose = false) => {
      const result = [];
      queue = [].concat(queue);
      stash = [].concat(stash);
      if (!stash.length) return queue;
      if (!queue.length) {
        return enclose ? utils.flatten(stash).map((ele) => `{${ele}}`) : stash;
      }
      for (const item of queue) {
        if (Array.isArray(item)) {
          for (const value of item) {
            result.push(append(value, stash, enclose));
          }
        } else {
          for (let ele of stash) {
            if (enclose === true && typeof ele === "string") ele = `{${ele}}`;
            result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
          }
        }
      }
      return utils.flatten(result);
    };
    var expand = (ast, options = {}) => {
      const rangeLimit = options.rangeLimit === void 0 ? 1e3 : options.rangeLimit;
      const walk = (node, parent = {}) => {
        node.queue = [];
        let p2 = parent;
        let q = parent.queue;
        while (p2.type !== "brace" && p2.type !== "root" && p2.parent) {
          p2 = p2.parent;
          q = p2.queue;
        }
        if (node.invalid || node.dollar) {
          q.push(append(q.pop(), stringify(node, options)));
          return;
        }
        if (node.type === "brace" && node.invalid !== true && node.nodes.length === 2) {
          q.push(append(q.pop(), ["{}"]));
          return;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
            throw new RangeError("expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.");
          }
          let range = fill(...args, options);
          if (range.length === 0) {
            range = stringify(node, options);
          }
          q.push(append(q.pop(), range));
          node.nodes = [];
          return;
        }
        const enclose = utils.encloseBrace(node);
        let queue = node.queue;
        let block = node;
        while (block.type !== "brace" && block.type !== "root" && block.parent) {
          block = block.parent;
          queue = block.queue;
        }
        for (let i2 = 0; i2 < node.nodes.length; i2++) {
          const child = node.nodes[i2];
          if (child.type === "comma" && node.type === "brace") {
            if (i2 === 1) queue.push("");
            queue.push("");
            continue;
          }
          if (child.type === "close") {
            q.push(append(q.pop(), queue, enclose));
            continue;
          }
          if (child.value && child.type !== "open") {
            queue.push(append(queue.pop(), child.value));
            continue;
          }
          if (child.nodes) {
            walk(child, node);
          }
        }
        return queue;
      };
      return utils.flatten(walk(ast));
    };
    module2.exports = expand;
  }
});

// ../node_modules/braces/lib/constants.js
var require_constants = __commonJS({
  "../node_modules/braces/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      MAX_LENGTH: 1e4,
      // Digits
      CHAR_0: "0",
      /* 0 */
      CHAR_9: "9",
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: "A",
      /* A */
      CHAR_LOWERCASE_A: "a",
      /* a */
      CHAR_UPPERCASE_Z: "Z",
      /* Z */
      CHAR_LOWERCASE_Z: "z",
      /* z */
      CHAR_LEFT_PARENTHESES: "(",
      /* ( */
      CHAR_RIGHT_PARENTHESES: ")",
      /* ) */
      CHAR_ASTERISK: "*",
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: "&",
      /* & */
      CHAR_AT: "@",
      /* @ */
      CHAR_BACKSLASH: "\\",
      /* \ */
      CHAR_BACKTICK: "`",
      /* ` */
      CHAR_CARRIAGE_RETURN: "\r",
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: "^",
      /* ^ */
      CHAR_COLON: ":",
      /* : */
      CHAR_COMMA: ",",
      /* , */
      CHAR_DOLLAR: "$",
      /* . */
      CHAR_DOT: ".",
      /* . */
      CHAR_DOUBLE_QUOTE: '"',
      /* " */
      CHAR_EQUAL: "=",
      /* = */
      CHAR_EXCLAMATION_MARK: "!",
      /* ! */
      CHAR_FORM_FEED: "\f",
      /* \f */
      CHAR_FORWARD_SLASH: "/",
      /* / */
      CHAR_HASH: "#",
      /* # */
      CHAR_HYPHEN_MINUS: "-",
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: "<",
      /* < */
      CHAR_LEFT_CURLY_BRACE: "{",
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: "[",
      /* [ */
      CHAR_LINE_FEED: "\n",
      /* \n */
      CHAR_NO_BREAK_SPACE: "\xA0",
      /* \u00A0 */
      CHAR_PERCENT: "%",
      /* % */
      CHAR_PLUS: "+",
      /* + */
      CHAR_QUESTION_MARK: "?",
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: ">",
      /* > */
      CHAR_RIGHT_CURLY_BRACE: "}",
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: "]",
      /* ] */
      CHAR_SEMICOLON: ";",
      /* ; */
      CHAR_SINGLE_QUOTE: "'",
      /* ' */
      CHAR_SPACE: " ",
      /*   */
      CHAR_TAB: "	",
      /* \t */
      CHAR_UNDERSCORE: "_",
      /* _ */
      CHAR_VERTICAL_LINE: "|",
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: "\uFEFF"
      /* \uFEFF */
    };
  }
});

// ../node_modules/braces/lib/parse.js
var require_parse = __commonJS({
  "../node_modules/braces/lib/parse.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var {
      MAX_LENGTH,
      CHAR_BACKSLASH,
      /* \ */
      CHAR_BACKTICK,
      /* ` */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_RIGHT_SQUARE_BRACKET,
      /* ] */
      CHAR_DOUBLE_QUOTE,
      /* " */
      CHAR_SINGLE_QUOTE,
      /* ' */
      CHAR_NO_BREAK_SPACE,
      CHAR_ZERO_WIDTH_NOBREAK_SPACE
    } = require_constants();
    var parse = (input, options = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      const opts = options || {};
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      if (input.length > max) {
        throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
      }
      const ast = { type: "root", input, nodes: [] };
      const stack = [ast];
      let block = ast;
      let prev = ast;
      let brackets = 0;
      const length = input.length;
      let index = 0;
      let depth = 0;
      let value;
      const advance = () => input[index++];
      const push = (node) => {
        if (node.type === "text" && prev.type === "dot") {
          prev.type = "text";
        }
        if (prev && prev.type === "text" && node.type === "text") {
          prev.value += node.value;
          return;
        }
        block.nodes.push(node);
        node.parent = block;
        node.prev = prev;
        prev = node;
        return node;
      };
      push({ type: "bos" });
      while (index < length) {
        block = stack[stack.length - 1];
        value = advance();
        if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
          continue;
        }
        if (value === CHAR_BACKSLASH) {
          push({ type: "text", value: (options.keepEscaping ? value : "") + advance() });
          continue;
        }
        if (value === CHAR_RIGHT_SQUARE_BRACKET) {
          push({ type: "text", value: "\\" + value });
          continue;
        }
        if (value === CHAR_LEFT_SQUARE_BRACKET) {
          brackets++;
          let next;
          while (index < length && (next = advance())) {
            value += next;
            if (next === CHAR_LEFT_SQUARE_BRACKET) {
              brackets++;
              continue;
            }
            if (next === CHAR_BACKSLASH) {
              value += advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              brackets--;
              if (brackets === 0) {
                break;
              }
            }
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_PARENTHESES) {
          block = push({ type: "paren", nodes: [] });
          stack.push(block);
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_RIGHT_PARENTHESES) {
          if (block.type !== "paren") {
            push({ type: "text", value });
            continue;
          }
          block = stack.pop();
          push({ type: "text", value });
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
          const open = value;
          let next;
          if (options.keepQuotes !== true) {
            value = "";
          }
          while (index < length && (next = advance())) {
            if (next === CHAR_BACKSLASH) {
              value += next + advance();
              continue;
            }
            if (next === open) {
              if (options.keepQuotes === true) value += next;
              break;
            }
            value += next;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_CURLY_BRACE) {
          depth++;
          const dollar = prev.value && prev.value.slice(-1) === "$" || block.dollar === true;
          const brace = {
            type: "brace",
            open: true,
            close: false,
            dollar,
            depth,
            commas: 0,
            ranges: 0,
            nodes: []
          };
          block = push(brace);
          stack.push(block);
          push({ type: "open", value });
          continue;
        }
        if (value === CHAR_RIGHT_CURLY_BRACE) {
          if (block.type !== "brace") {
            push({ type: "text", value });
            continue;
          }
          const type = "close";
          block = stack.pop();
          block.close = true;
          push({ type, value });
          depth--;
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_COMMA && depth > 0) {
          if (block.ranges > 0) {
            block.ranges = 0;
            const open = block.nodes.shift();
            block.nodes = [open, { type: "text", value: stringify(block) }];
          }
          push({ type: "comma", value });
          block.commas++;
          continue;
        }
        if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
          const siblings = block.nodes;
          if (depth === 0 || siblings.length === 0) {
            push({ type: "text", value });
            continue;
          }
          if (prev.type === "dot") {
            block.range = [];
            prev.value += value;
            prev.type = "range";
            if (block.nodes.length !== 3 && block.nodes.length !== 5) {
              block.invalid = true;
              block.ranges = 0;
              prev.type = "text";
              continue;
            }
            block.ranges++;
            block.args = [];
            continue;
          }
          if (prev.type === "range") {
            siblings.pop();
            const before = siblings[siblings.length - 1];
            before.value += prev.value + value;
            prev = before;
            block.ranges--;
            continue;
          }
          push({ type: "dot", value });
          continue;
        }
        push({ type: "text", value });
      }
      do {
        block = stack.pop();
        if (block.type !== "root") {
          block.nodes.forEach((node) => {
            if (!node.nodes) {
              if (node.type === "open") node.isOpen = true;
              if (node.type === "close") node.isClose = true;
              if (!node.nodes) node.type = "text";
              node.invalid = true;
            }
          });
          const parent = stack[stack.length - 1];
          const index2 = parent.nodes.indexOf(block);
          parent.nodes.splice(index2, 1, ...block.nodes);
        }
      } while (stack.length > 0);
      push({ type: "eos" });
      return ast;
    };
    module2.exports = parse;
  }
});

// ../node_modules/braces/index.js
var require_braces = __commonJS({
  "../node_modules/braces/index.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var compile2 = require_compile();
    var expand = require_expand();
    var parse = require_parse();
    var braces = (input, options = {}) => {
      let output = [];
      if (Array.isArray(input)) {
        for (const pattern of input) {
          const result = braces.create(pattern, options);
          if (Array.isArray(result)) {
            output.push(...result);
          } else {
            output.push(result);
          }
        }
      } else {
        output = [].concat(braces.create(input, options));
      }
      if (options && options.expand === true && options.nodupes === true) {
        output = [...new Set(output)];
      }
      return output;
    };
    braces.parse = (input, options = {}) => parse(input, options);
    braces.stringify = (input, options = {}) => {
      if (typeof input === "string") {
        return stringify(braces.parse(input, options), options);
      }
      return stringify(input, options);
    };
    braces.compile = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      return compile2(input, options);
    };
    braces.expand = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      let result = expand(input, options);
      if (options.noempty === true) {
        result = result.filter(Boolean);
      }
      if (options.nodupes === true) {
        result = [...new Set(result)];
      }
      return result;
    };
    braces.create = (input, options = {}) => {
      if (input === "" || input.length < 3) {
        return [input];
      }
      return options.expand !== true ? braces.compile(input, options) : braces.expand(input, options);
    };
    module2.exports = braces;
  }
});

// ../node_modules/micromatch/node_modules/picomatch/lib/constants.js
var require_constants2 = __commonJS({
  "../node_modules/micromatch/node_modules/picomatch/lib/constants.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DEFAULT_MAX_EXTGLOB_RECURSION = 0;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR2 = `${QMARK}*?`;
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR: STAR2,
      START_ANCHOR
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
    };
    var POSIX_REGEX_SOURCE = {
      __proto__: null,
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module2.exports = {
      DEFAULT_MAX_EXTGLOB_RECURSION,
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        __proto__: null,
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      SEP: path.sep,
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// ../node_modules/micromatch/node_modules/picomatch/lib/utils.js
var require_utils2 = __commonJS({
  "../node_modules/micromatch/node_modules/picomatch/lib/utils.js"(exports2) {
    "use strict";
    var path = require("path");
    var win32 = process.platform === "win32";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants2();
    exports2.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports2.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports2.isRegexChar = (str) => str.length === 1 && exports2.hasRegexChars(str);
    exports2.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports2.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports2.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports2.supportsLookbehinds = () => {
      const segs = process.version.slice(1).split(".").map(Number);
      if (segs.length === 3 && segs[0] >= 9 || segs[0] === 8 && segs[1] >= 10) {
        return true;
      }
      return false;
    };
    exports2.isWindows = (options) => {
      if (options && typeof options.windows === "boolean") {
        return options.windows;
      }
      return win32 === true || path.sep === "\\";
    };
    exports2.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports2.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports2.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports2.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
  }
});

// ../node_modules/micromatch/node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "../node_modules/micromatch/node_modules/picomatch/lib/scan.js"(exports2, module2) {
    "use strict";
    var utils = require_utils2();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants2();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  isGlob = token.isGlob = true;
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_LEFT_PARENTHESES) {
                backslashes = token.backslashes = true;
                code = advance();
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob) glob = utils.removeBackslashes(glob);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n2 = prevIndex ? prevIndex + 1 : start;
          const i2 = slashes[idx];
          const value = input.slice(n2, i2);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (idx !== 0 || value !== "") {
            parts.push(value);
          }
          prevIndex = i2;
        }
        if (prevIndex && prevIndex + 1 < input.length) {
          const value = input.slice(prevIndex + 1);
          parts.push(value);
          if (opts.tokens) {
            tokens[tokens.length - 1].value = value;
            depth(tokens[tokens.length - 1]);
            state.maxDepth += tokens[tokens.length - 1].depth;
          }
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module2.exports = scan;
  }
});

// ../node_modules/micromatch/node_modules/picomatch/lib/parse.js
var require_parse2 = __commonJS({
  "../node_modules/micromatch/node_modules/picomatch/lib/parse.js"(exports2, module2) {
    "use strict";
    var constants = require_constants2();
    var utils = require_utils2();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v2) => utils.escapeRegex(v2)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var splitTopLevel = (input) => {
      const parts = [];
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let value = "";
      let escaped = false;
      for (const ch of input) {
        if (escaped === true) {
          value += ch;
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          value += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          value += ch;
          continue;
        }
        if (quote === 0) {
          if (ch === "[") {
            bracket++;
          } else if (ch === "]" && bracket > 0) {
            bracket--;
          } else if (bracket === 0) {
            if (ch === "(") {
              paren++;
            } else if (ch === ")" && paren > 0) {
              paren--;
            } else if (ch === "|" && paren === 0) {
              parts.push(value);
              value = "";
              continue;
            }
          }
        }
        value += ch;
      }
      parts.push(value);
      return parts;
    };
    var isPlainBranch = (branch) => {
      let escaped = false;
      for (const ch of branch) {
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (/[?*+@!()[\]{}]/.test(ch)) {
          return false;
        }
      }
      return true;
    };
    var normalizeSimpleBranch = (branch) => {
      let value = branch.trim();
      let changed = true;
      while (changed === true) {
        changed = false;
        if (/^@\([^\\()[\]{}|]+\)$/.test(value)) {
          value = value.slice(2, -1);
          changed = true;
        }
      }
      if (!isPlainBranch(value)) {
        return;
      }
      return value.replace(/\\(.)/g, "$1");
    };
    var hasRepeatedCharPrefixOverlap = (branches) => {
      const values = branches.map(normalizeSimpleBranch).filter(Boolean);
      for (let i2 = 0; i2 < values.length; i2++) {
        for (let j = i2 + 1; j < values.length; j++) {
          const a2 = values[i2];
          const b2 = values[j];
          const char = a2[0];
          if (!char || a2 !== char.repeat(a2.length) || b2 !== char.repeat(b2.length)) {
            continue;
          }
          if (a2 === b2 || a2.startsWith(b2) || b2.startsWith(a2)) {
            return true;
          }
        }
      }
      return false;
    };
    var parseRepeatedExtglob = (pattern, requireEnd = true) => {
      if (pattern[0] !== "+" && pattern[0] !== "*" || pattern[1] !== "(") {
        return;
      }
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let escaped = false;
      for (let i2 = 1; i2 < pattern.length; i2++) {
        const ch = pattern[i2];
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          continue;
        }
        if (quote === 1) {
          continue;
        }
        if (ch === "[") {
          bracket++;
          continue;
        }
        if (ch === "]" && bracket > 0) {
          bracket--;
          continue;
        }
        if (bracket > 0) {
          continue;
        }
        if (ch === "(") {
          paren++;
          continue;
        }
        if (ch === ")") {
          paren--;
          if (paren === 0) {
            if (requireEnd === true && i2 !== pattern.length - 1) {
              return;
            }
            return {
              type: pattern[0],
              body: pattern.slice(2, i2),
              end: i2
            };
          }
        }
      }
    };
    var getStarExtglobSequenceOutput = (pattern) => {
      let index = 0;
      const chars = [];
      while (index < pattern.length) {
        const match = parseRepeatedExtglob(pattern.slice(index), false);
        if (!match || match.type !== "*") {
          return;
        }
        const branches = splitTopLevel(match.body).map((branch2) => branch2.trim());
        if (branches.length !== 1) {
          return;
        }
        const branch = normalizeSimpleBranch(branches[0]);
        if (!branch || branch.length !== 1) {
          return;
        }
        chars.push(branch);
        index += match.end + 1;
      }
      if (chars.length < 1) {
        return;
      }
      const source = chars.length === 1 ? utils.escapeRegex(chars[0]) : `[${chars.map((ch) => utils.escapeRegex(ch)).join("")}]`;
      return `${source}*`;
    };
    var repeatedExtglobRecursion = (pattern) => {
      let depth = 0;
      let value = pattern.trim();
      let match = parseRepeatedExtglob(value);
      while (match) {
        depth++;
        value = match.body.trim();
        match = parseRepeatedExtglob(value);
      }
      return depth;
    };
    var analyzeRepeatedExtglob = (body, options) => {
      if (options.maxExtglobRecursion === false) {
        return { risky: false };
      }
      const max = typeof options.maxExtglobRecursion === "number" ? options.maxExtglobRecursion : constants.DEFAULT_MAX_EXTGLOB_RECURSION;
      const branches = splitTopLevel(body).map((branch) => branch.trim());
      if (branches.length > 1) {
        if (branches.some((branch) => branch === "") || branches.some((branch) => /^[*?]+$/.test(branch)) || hasRepeatedCharPrefixOverlap(branches)) {
          return { risky: true };
        }
      }
      for (const branch of branches) {
        const safeOutput = getStarExtglobSequenceOutput(branch);
        if (safeOutput) {
          return { risky: true, safeOutput };
        }
        if (repeatedExtglobRecursion(branch) > max) {
          return { risky: true };
        }
      }
      return { risky: false };
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const win32 = utils.isWindows(options);
      const PLATFORM_CHARS = constants.globChars(win32);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR: STAR2,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR2;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n2 = 1) => input[state.index + n2];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.value += tok.value;
          prev.output = (prev.output || "") + tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        token.startIndex = state.index;
        token.tokensIndex = tokens.length;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        const literal = input.slice(token.startIndex, state.index + 1);
        const body = input.slice(token.startIndex + 2, state.index);
        const analysis = analyzeRepeatedExtglob(body, opts);
        if ((token.type === "plus" || token.type === "star") && analysis.risky) {
          const safeOutput = analysis.safeOutput ? (token.output ? "" : ONE_CHAR) + (opts.capture ? `(${analysis.safeOutput})` : analysis.safeOutput) : void 0;
          const open = tokens[token.tokensIndex];
          open.type = "text";
          open.value = literal;
          open.output = safeOutput || utils.escapeRegex(literal);
          for (let i2 = token.tokensIndex + 1; i2 < tokens.length; i2++) {
            tokens[i2].value = "";
            tokens[i2].output = "";
            delete tokens[i2].suffix;
          }
          state.output = token.output + open.output;
          state.backtrack = true;
          push({ type: "paren", extglob: true, value, output: "" });
          decrement("parens");
          return;
        }
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse(rest, { ...options, fastpaths: false }).output;
            output = token.close = `)${expression})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m2, esc, chars, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m2;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star : "");
            }
            return star;
          }
          return esc ? m2 : `\\${m2}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m2) => {
              return m2.length % 2 === 0 ? "\\\\" : m2 ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i2 = arr.length - 1; i2 >= 0; i2--) {
              tokens.pop();
              if (arr[i2].type === "brace") {
                break;
              }
              if (arr[i2].type !== "dots") {
                range.unshift(arr[i2].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t2 of toks) {
              state.output += t2.output || t2.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (next === "<" && !utils.supportsLookbehinds()) {
              throw new Error("Node.js v10 or higher is required for regex lookbehinds");
            }
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const win32 = utils.isWindows(options);
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR: STAR2,
        START_ANCHOR
      } = constants.globChars(win32);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR2;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true) return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match) return;
            const source2 = create(match[1]);
            if (!source2) return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module2.exports = parse;
  }
});

// ../node_modules/micromatch/node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "../node_modules/micromatch/node_modules/picomatch/lib/picomatch.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var scan = require_scan();
    var parse = require_parse2();
    var utils = require_utils2();
    var constants = require_constants2();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch = (glob, options, returnState = false) => {
      if (Array.isArray(glob)) {
        const fns = glob.map((input) => picomatch(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix = utils.isWindows(options);
      const regex = isState ? picomatch.compileRe(glob, options) : picomatch.makeRe(glob, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
        const result = { glob, state, regex, posix, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch.test = (input, regex, options, { glob, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix ? utils.toPosixSlashes : null);
      let match = input === glob;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch.matchBase(input, regex, options, posix);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch.matchBase = (input, glob, options, posix = utils.isWindows(options)) => {
      const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
      return regex.test(path.basename(input));
    };
    picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    picomatch.parse = (pattern, options) => {
      if (Array.isArray(pattern)) return pattern.map((p2) => picomatch.parse(p2, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch.scan = (input, options) => scan(input, options);
    picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err) {
        if (options && options.debug === true) throw err;
        return /$^/;
      }
    };
    picomatch.constants = constants;
    module2.exports = picomatch;
  }
});

// ../node_modules/micromatch/node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "../node_modules/micromatch/node_modules/picomatch/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_picomatch();
  }
});

// ../node_modules/micromatch/index.js
var require_micromatch = __commonJS({
  "../node_modules/micromatch/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var braces = require_braces();
    var picomatch = require_picomatch2();
    var utils = require_utils2();
    var isEmptyString = (v2) => v2 === "" || v2 === "./";
    var hasBraces = (v2) => {
      const index = v2.indexOf("{");
      return index > -1 && v2.indexOf("}", index) > -1;
    };
    var micromatch = (list, patterns, options) => {
      patterns = [].concat(patterns);
      list = [].concat(list);
      let omit = /* @__PURE__ */ new Set();
      let keep = /* @__PURE__ */ new Set();
      let items = /* @__PURE__ */ new Set();
      let negatives = 0;
      let onResult = (state) => {
        items.add(state.output);
        if (options && options.onResult) {
          options.onResult(state);
        }
      };
      for (let i2 = 0; i2 < patterns.length; i2++) {
        let isMatch = picomatch(String(patterns[i2]), { ...options, onResult }, true);
        let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
        if (negated) negatives++;
        for (let item of list) {
          let matched = isMatch(item, true);
          let match = negated ? !matched.isMatch : matched.isMatch;
          if (!match) continue;
          if (negated) {
            omit.add(matched.output);
          } else {
            omit.delete(matched.output);
            keep.add(matched.output);
          }
        }
      }
      let result = negatives === patterns.length ? [...items] : [...keep];
      let matches = result.filter((item) => !omit.has(item));
      if (options && matches.length === 0) {
        if (options.failglob === true) {
          throw new Error(`No matches found for "${patterns.join(", ")}"`);
        }
        if (options.nonull === true || options.nullglob === true) {
          return options.unescape ? patterns.map((p2) => p2.replace(/\\/g, "")) : patterns;
        }
      }
      return matches;
    };
    micromatch.match = micromatch;
    micromatch.matcher = (pattern, options) => picomatch(pattern, options);
    micromatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    micromatch.any = micromatch.isMatch;
    micromatch.not = (list, patterns, options = {}) => {
      patterns = [].concat(patterns).map(String);
      let result = /* @__PURE__ */ new Set();
      let items = [];
      let onResult = (state) => {
        if (options.onResult) options.onResult(state);
        items.push(state.output);
      };
      let matches = new Set(micromatch(list, patterns, { ...options, onResult }));
      for (let item of items) {
        if (!matches.has(item)) {
          result.add(item);
        }
      }
      return [...result];
    };
    micromatch.contains = (str, pattern, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      if (Array.isArray(pattern)) {
        return pattern.some((p2) => micromatch.contains(str, p2, options));
      }
      if (typeof pattern === "string") {
        if (isEmptyString(str) || isEmptyString(pattern)) {
          return false;
        }
        if (str.includes(pattern) || str.startsWith("./") && str.slice(2).includes(pattern)) {
          return true;
        }
      }
      return micromatch.isMatch(str, pattern, { ...options, contains: true });
    };
    micromatch.matchKeys = (obj, patterns, options) => {
      if (!utils.isObject(obj)) {
        throw new TypeError("Expected the first argument to be an object");
      }
      let keys = micromatch(Object.keys(obj), patterns, options);
      let res = {};
      for (let key of keys) res[key] = obj[key];
      return res;
    };
    micromatch.some = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (items.some((item) => isMatch(item))) {
          return true;
        }
      }
      return false;
    };
    micromatch.every = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (!items.every((item) => isMatch(item))) {
          return false;
        }
      }
      return true;
    };
    micromatch.all = (str, patterns, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      return [].concat(patterns).every((p2) => picomatch(p2, options)(str));
    };
    micromatch.capture = (glob, input, options) => {
      let posix = utils.isWindows(options);
      let regex = picomatch.makeRe(String(glob), { ...options, capture: true });
      let match = regex.exec(posix ? utils.toPosixSlashes(input) : input);
      if (match) {
        return match.slice(1).map((v2) => v2 === void 0 ? "" : v2);
      }
    };
    micromatch.makeRe = (...args) => picomatch.makeRe(...args);
    micromatch.scan = (...args) => picomatch.scan(...args);
    micromatch.parse = (patterns, options) => {
      let res = [];
      for (let pattern of [].concat(patterns || [])) {
        for (let str of braces(String(pattern), options)) {
          res.push(picomatch.parse(str, options));
        }
      }
      return res;
    };
    micromatch.braces = (pattern, options) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      if (options && options.nobrace === true || !hasBraces(pattern)) {
        return [pattern];
      }
      return braces(pattern, options);
    };
    micromatch.braceExpand = (pattern, options) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      return micromatch.braces(pattern, { ...options, expand: true });
    };
    micromatch.hasBraces = hasBraces;
    module2.exports = micromatch;
  }
});

// ../node_modules/fast-glob/out/utils/pattern.js
var require_pattern = __commonJS({
  "../node_modules/fast-glob/out/utils/pattern.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isAbsolute = exports2.partitionAbsoluteAndRelative = exports2.removeDuplicateSlashes = exports2.matchAny = exports2.convertPatternsToRe = exports2.makeRe = exports2.getPatternParts = exports2.expandBraceExpansion = exports2.expandPatternsWithBraceExpansion = exports2.isAffectDepthOfReadingPattern = exports2.endsWithSlashGlobStar = exports2.hasGlobStar = exports2.getBaseDirectory = exports2.isPatternRelatedToParentDirectory = exports2.getPatternsOutsideCurrentDirectory = exports2.getPatternsInsideCurrentDirectory = exports2.getPositivePatterns = exports2.getNegativePatterns = exports2.isPositivePattern = exports2.isNegativePattern = exports2.convertToNegativePattern = exports2.convertToPositivePattern = exports2.isDynamicPattern = exports2.isStaticPattern = void 0;
    var path = require("path");
    var globParent = require_glob_parent();
    var micromatch = require_micromatch();
    var GLOBSTAR = "**";
    var ESCAPE_SYMBOL = "\\";
    var COMMON_GLOB_SYMBOLS_RE = /[*?]|^!/;
    var REGEX_CHARACTER_CLASS_SYMBOLS_RE = /\[[^[]*]/;
    var REGEX_GROUP_SYMBOLS_RE = /(?:^|[^!*+?@])\([^(]*\|[^|]*\)/;
    var GLOB_EXTENSION_SYMBOLS_RE = /[!*+?@]\([^(]*\)/;
    var BRACE_EXPANSION_SEPARATORS_RE = /,|\.\./;
    var DOUBLE_SLASH_RE = /(?!^)\/{2,}/g;
    function isStaticPattern(pattern, options = {}) {
      return !isDynamicPattern(pattern, options);
    }
    exports2.isStaticPattern = isStaticPattern;
    function isDynamicPattern(pattern, options = {}) {
      if (pattern === "") {
        return false;
      }
      if (options.caseSensitiveMatch === false || pattern.includes(ESCAPE_SYMBOL)) {
        return true;
      }
      if (COMMON_GLOB_SYMBOLS_RE.test(pattern) || REGEX_CHARACTER_CLASS_SYMBOLS_RE.test(pattern) || REGEX_GROUP_SYMBOLS_RE.test(pattern)) {
        return true;
      }
      if (options.extglob !== false && GLOB_EXTENSION_SYMBOLS_RE.test(pattern)) {
        return true;
      }
      if (options.braceExpansion !== false && hasBraceExpansion(pattern)) {
        return true;
      }
      return false;
    }
    exports2.isDynamicPattern = isDynamicPattern;
    function hasBraceExpansion(pattern) {
      const openingBraceIndex = pattern.indexOf("{");
      if (openingBraceIndex === -1) {
        return false;
      }
      const closingBraceIndex = pattern.indexOf("}", openingBraceIndex + 1);
      if (closingBraceIndex === -1) {
        return false;
      }
      const braceContent = pattern.slice(openingBraceIndex, closingBraceIndex);
      return BRACE_EXPANSION_SEPARATORS_RE.test(braceContent);
    }
    function convertToPositivePattern(pattern) {
      return isNegativePattern(pattern) ? pattern.slice(1) : pattern;
    }
    exports2.convertToPositivePattern = convertToPositivePattern;
    function convertToNegativePattern(pattern) {
      return "!" + pattern;
    }
    exports2.convertToNegativePattern = convertToNegativePattern;
    function isNegativePattern(pattern) {
      return pattern.startsWith("!") && pattern[1] !== "(";
    }
    exports2.isNegativePattern = isNegativePattern;
    function isPositivePattern(pattern) {
      return !isNegativePattern(pattern);
    }
    exports2.isPositivePattern = isPositivePattern;
    function getNegativePatterns(patterns) {
      return patterns.filter(isNegativePattern);
    }
    exports2.getNegativePatterns = getNegativePatterns;
    function getPositivePatterns(patterns) {
      return patterns.filter(isPositivePattern);
    }
    exports2.getPositivePatterns = getPositivePatterns;
    function getPatternsInsideCurrentDirectory(patterns) {
      return patterns.filter((pattern) => !isPatternRelatedToParentDirectory(pattern));
    }
    exports2.getPatternsInsideCurrentDirectory = getPatternsInsideCurrentDirectory;
    function getPatternsOutsideCurrentDirectory(patterns) {
      return patterns.filter(isPatternRelatedToParentDirectory);
    }
    exports2.getPatternsOutsideCurrentDirectory = getPatternsOutsideCurrentDirectory;
    function isPatternRelatedToParentDirectory(pattern) {
      return pattern.startsWith("..") || pattern.startsWith("./..");
    }
    exports2.isPatternRelatedToParentDirectory = isPatternRelatedToParentDirectory;
    function getBaseDirectory(pattern) {
      return globParent(pattern, { flipBackslashes: false });
    }
    exports2.getBaseDirectory = getBaseDirectory;
    function hasGlobStar(pattern) {
      return pattern.includes(GLOBSTAR);
    }
    exports2.hasGlobStar = hasGlobStar;
    function endsWithSlashGlobStar(pattern) {
      return pattern.endsWith("/" + GLOBSTAR);
    }
    exports2.endsWithSlashGlobStar = endsWithSlashGlobStar;
    function isAffectDepthOfReadingPattern(pattern) {
      const basename2 = path.basename(pattern);
      return endsWithSlashGlobStar(pattern) || isStaticPattern(basename2);
    }
    exports2.isAffectDepthOfReadingPattern = isAffectDepthOfReadingPattern;
    function expandPatternsWithBraceExpansion(patterns) {
      return patterns.reduce((collection, pattern) => {
        return collection.concat(expandBraceExpansion(pattern));
      }, []);
    }
    exports2.expandPatternsWithBraceExpansion = expandPatternsWithBraceExpansion;
    function expandBraceExpansion(pattern) {
      const patterns = micromatch.braces(pattern, { expand: true, nodupes: true, keepEscaping: true });
      patterns.sort((a2, b2) => a2.length - b2.length);
      return patterns.filter((pattern2) => pattern2 !== "");
    }
    exports2.expandBraceExpansion = expandBraceExpansion;
    function getPatternParts(pattern, options) {
      let { parts } = micromatch.scan(pattern, Object.assign(Object.assign({}, options), { parts: true }));
      if (parts.length === 0) {
        parts = [pattern];
      }
      if (parts[0].startsWith("/")) {
        parts[0] = parts[0].slice(1);
        parts.unshift("");
      }
      return parts;
    }
    exports2.getPatternParts = getPatternParts;
    function makeRe(pattern, options) {
      return micromatch.makeRe(pattern, options);
    }
    exports2.makeRe = makeRe;
    function convertPatternsToRe(patterns, options) {
      return patterns.map((pattern) => makeRe(pattern, options));
    }
    exports2.convertPatternsToRe = convertPatternsToRe;
    function matchAny(entry, patternsRe) {
      return patternsRe.some((patternRe) => patternRe.test(entry));
    }
    exports2.matchAny = matchAny;
    function removeDuplicateSlashes(pattern) {
      return pattern.replace(DOUBLE_SLASH_RE, "/");
    }
    exports2.removeDuplicateSlashes = removeDuplicateSlashes;
    function partitionAbsoluteAndRelative(patterns) {
      const absolute = [];
      const relative = [];
      for (const pattern of patterns) {
        if (isAbsolute(pattern)) {
          absolute.push(pattern);
        } else {
          relative.push(pattern);
        }
      }
      return [absolute, relative];
    }
    exports2.partitionAbsoluteAndRelative = partitionAbsoluteAndRelative;
    function isAbsolute(pattern) {
      return path.isAbsolute(pattern);
    }
    exports2.isAbsolute = isAbsolute;
  }
});

// ../node_modules/merge2/index.js
var require_merge2 = __commonJS({
  "../node_modules/merge2/index.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream");
    var PassThrough = Stream.PassThrough;
    var slice2 = Array.prototype.slice;
    module2.exports = merge2;
    function merge2() {
      const streamsQueue = [];
      const args = slice2.call(arguments);
      let merging = false;
      let options = args[args.length - 1];
      if (options && !Array.isArray(options) && options.pipe == null) {
        args.pop();
      } else {
        options = {};
      }
      const doEnd = options.end !== false;
      const doPipeError = options.pipeError === true;
      if (options.objectMode == null) {
        options.objectMode = true;
      }
      if (options.highWaterMark == null) {
        options.highWaterMark = 64 * 1024;
      }
      const mergedStream = PassThrough(options);
      function addStream() {
        for (let i2 = 0, len = arguments.length; i2 < len; i2++) {
          streamsQueue.push(pauseStreams(arguments[i2], options));
        }
        mergeStream();
        return this;
      }
      function mergeStream() {
        if (merging) {
          return;
        }
        merging = true;
        let streams = streamsQueue.shift();
        if (!streams) {
          process.nextTick(endStream);
          return;
        }
        if (!Array.isArray(streams)) {
          streams = [streams];
        }
        let pipesCount = streams.length + 1;
        function next() {
          if (--pipesCount > 0) {
            return;
          }
          merging = false;
          mergeStream();
        }
        function pipe(stream) {
          function onend() {
            stream.removeListener("merge2UnpipeEnd", onend);
            stream.removeListener("end", onend);
            if (doPipeError) {
              stream.removeListener("error", onerror);
            }
            next();
          }
          function onerror(err) {
            mergedStream.emit("error", err);
          }
          if (stream._readableState.endEmitted) {
            return next();
          }
          stream.on("merge2UnpipeEnd", onend);
          stream.on("end", onend);
          if (doPipeError) {
            stream.on("error", onerror);
          }
          stream.pipe(mergedStream, { end: false });
          stream.resume();
        }
        for (let i2 = 0; i2 < streams.length; i2++) {
          pipe(streams[i2]);
        }
        next();
      }
      function endStream() {
        merging = false;
        mergedStream.emit("queueDrain");
        if (doEnd) {
          mergedStream.end();
        }
      }
      mergedStream.setMaxListeners(0);
      mergedStream.add = addStream;
      mergedStream.on("unpipe", function(stream) {
        stream.emit("merge2UnpipeEnd");
      });
      if (args.length) {
        addStream.apply(null, args);
      }
      return mergedStream;
    }
    function pauseStreams(streams, options) {
      if (!Array.isArray(streams)) {
        if (!streams._readableState && streams.pipe) {
          streams = streams.pipe(PassThrough(options));
        }
        if (!streams._readableState || !streams.pause || !streams.pipe) {
          throw new Error("Only readable stream can be merged.");
        }
        streams.pause();
      } else {
        for (let i2 = 0, len = streams.length; i2 < len; i2++) {
          streams[i2] = pauseStreams(streams[i2], options);
        }
      }
      return streams;
    }
  }
});

// ../node_modules/fast-glob/out/utils/stream.js
var require_stream = __commonJS({
  "../node_modules/fast-glob/out/utils/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.merge = void 0;
    var merge2 = require_merge2();
    function merge(streams) {
      const mergedStream = merge2(streams);
      streams.forEach((stream) => {
        stream.once("error", (error) => mergedStream.emit("error", error));
      });
      mergedStream.once("close", () => propagateCloseEventToSources(streams));
      mergedStream.once("end", () => propagateCloseEventToSources(streams));
      return mergedStream;
    }
    exports2.merge = merge;
    function propagateCloseEventToSources(streams) {
      streams.forEach((stream) => stream.emit("close"));
    }
  }
});

// ../node_modules/fast-glob/out/utils/string.js
var require_string = __commonJS({
  "../node_modules/fast-glob/out/utils/string.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isEmpty = exports2.isString = void 0;
    function isString(input) {
      return typeof input === "string";
    }
    exports2.isString = isString;
    function isEmpty(input) {
      return input === "";
    }
    exports2.isEmpty = isEmpty;
  }
});

// ../node_modules/fast-glob/out/utils/index.js
var require_utils3 = __commonJS({
  "../node_modules/fast-glob/out/utils/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.string = exports2.stream = exports2.pattern = exports2.path = exports2.fs = exports2.errno = exports2.array = void 0;
    var array = require_array();
    exports2.array = array;
    var errno = require_errno();
    exports2.errno = errno;
    var fs = require_fs();
    exports2.fs = fs;
    var path = require_path();
    exports2.path = path;
    var pattern = require_pattern();
    exports2.pattern = pattern;
    var stream = require_stream();
    exports2.stream = stream;
    var string = require_string();
    exports2.string = string;
  }
});

// ../node_modules/fast-glob/out/managers/tasks.js
var require_tasks = __commonJS({
  "../node_modules/fast-glob/out/managers/tasks.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.convertPatternGroupToTask = exports2.convertPatternGroupsToTasks = exports2.groupPatternsByBaseDirectory = exports2.getNegativePatternsAsPositive = exports2.getPositivePatterns = exports2.convertPatternsToTasks = exports2.generate = void 0;
    var utils = require_utils3();
    function generate(input, settings) {
      const patterns = processPatterns(input, settings);
      const ignore = processPatterns(settings.ignore, settings);
      const positivePatterns = getPositivePatterns(patterns);
      const negativePatterns = getNegativePatternsAsPositive(patterns, ignore);
      const staticPatterns = positivePatterns.filter((pattern) => utils.pattern.isStaticPattern(pattern, settings));
      const dynamicPatterns = positivePatterns.filter((pattern) => utils.pattern.isDynamicPattern(pattern, settings));
      const staticTasks = convertPatternsToTasks(
        staticPatterns,
        negativePatterns,
        /* dynamic */
        false
      );
      const dynamicTasks = convertPatternsToTasks(
        dynamicPatterns,
        negativePatterns,
        /* dynamic */
        true
      );
      return staticTasks.concat(dynamicTasks);
    }
    exports2.generate = generate;
    function processPatterns(input, settings) {
      let patterns = input;
      if (settings.braceExpansion) {
        patterns = utils.pattern.expandPatternsWithBraceExpansion(patterns);
      }
      if (settings.baseNameMatch) {
        patterns = patterns.map((pattern) => pattern.includes("/") ? pattern : `**/${pattern}`);
      }
      return patterns.map((pattern) => utils.pattern.removeDuplicateSlashes(pattern));
    }
    function convertPatternsToTasks(positive, negative, dynamic) {
      const tasks = [];
      const patternsOutsideCurrentDirectory = utils.pattern.getPatternsOutsideCurrentDirectory(positive);
      const patternsInsideCurrentDirectory = utils.pattern.getPatternsInsideCurrentDirectory(positive);
      const outsideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsOutsideCurrentDirectory);
      const insideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsInsideCurrentDirectory);
      tasks.push(...convertPatternGroupsToTasks(outsideCurrentDirectoryGroup, negative, dynamic));
      if ("." in insideCurrentDirectoryGroup) {
        tasks.push(convertPatternGroupToTask(".", patternsInsideCurrentDirectory, negative, dynamic));
      } else {
        tasks.push(...convertPatternGroupsToTasks(insideCurrentDirectoryGroup, negative, dynamic));
      }
      return tasks;
    }
    exports2.convertPatternsToTasks = convertPatternsToTasks;
    function getPositivePatterns(patterns) {
      return utils.pattern.getPositivePatterns(patterns);
    }
    exports2.getPositivePatterns = getPositivePatterns;
    function getNegativePatternsAsPositive(patterns, ignore) {
      const negative = utils.pattern.getNegativePatterns(patterns).concat(ignore);
      const positive = negative.map(utils.pattern.convertToPositivePattern);
      return positive;
    }
    exports2.getNegativePatternsAsPositive = getNegativePatternsAsPositive;
    function groupPatternsByBaseDirectory(patterns) {
      const group = {};
      return patterns.reduce((collection, pattern) => {
        const base = utils.pattern.getBaseDirectory(pattern);
        if (base in collection) {
          collection[base].push(pattern);
        } else {
          collection[base] = [pattern];
        }
        return collection;
      }, group);
    }
    exports2.groupPatternsByBaseDirectory = groupPatternsByBaseDirectory;
    function convertPatternGroupsToTasks(positive, negative, dynamic) {
      return Object.keys(positive).map((base) => {
        return convertPatternGroupToTask(base, positive[base], negative, dynamic);
      });
    }
    exports2.convertPatternGroupsToTasks = convertPatternGroupsToTasks;
    function convertPatternGroupToTask(base, positive, negative, dynamic) {
      return {
        dynamic,
        positive,
        negative,
        base,
        patterns: [].concat(positive, negative.map(utils.pattern.convertToNegativePattern))
      };
    }
    exports2.convertPatternGroupToTask = convertPatternGroupToTask;
  }
});

// ../node_modules/@nodelib/fs.stat/out/providers/async.js
var require_async = __commonJS({
  "../node_modules/@nodelib/fs.stat/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.read = void 0;
    function read(path, settings, callback) {
      settings.fs.lstat(path, (lstatError, lstat) => {
        if (lstatError !== null) {
          callFailureCallback(callback, lstatError);
          return;
        }
        if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
          callSuccessCallback(callback, lstat);
          return;
        }
        settings.fs.stat(path, (statError, stat) => {
          if (statError !== null) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              callFailureCallback(callback, statError);
              return;
            }
            callSuccessCallback(callback, lstat);
            return;
          }
          if (settings.markSymbolicLink) {
            stat.isSymbolicLink = () => true;
          }
          callSuccessCallback(callback, stat);
        });
      });
    }
    exports2.read = read;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, result) {
      callback(null, result);
    }
  }
});

// ../node_modules/@nodelib/fs.stat/out/providers/sync.js
var require_sync = __commonJS({
  "../node_modules/@nodelib/fs.stat/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.read = void 0;
    function read(path, settings) {
      const lstat = settings.fs.lstatSync(path);
      if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
        return lstat;
      }
      try {
        const stat = settings.fs.statSync(path);
        if (settings.markSymbolicLink) {
          stat.isSymbolicLink = () => true;
        }
        return stat;
      } catch (error) {
        if (!settings.throwErrorOnBrokenSymbolicLink) {
          return lstat;
        }
        throw error;
      }
    }
    exports2.read = read;
  }
});

// ../node_modules/@nodelib/fs.stat/out/adapters/fs.js
var require_fs2 = __commonJS({
  "../node_modules/@nodelib/fs.stat/out/adapters/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createFileSystemAdapter = exports2.FILE_SYSTEM_ADAPTER = void 0;
    var fs = require("fs");
    exports2.FILE_SYSTEM_ADAPTER = {
      lstat: fs.lstat,
      stat: fs.stat,
      lstatSync: fs.lstatSync,
      statSync: fs.statSync
    };
    function createFileSystemAdapter(fsMethods) {
      if (fsMethods === void 0) {
        return exports2.FILE_SYSTEM_ADAPTER;
      }
      return Object.assign(Object.assign({}, exports2.FILE_SYSTEM_ADAPTER), fsMethods);
    }
    exports2.createFileSystemAdapter = createFileSystemAdapter;
  }
});

// ../node_modules/@nodelib/fs.stat/out/settings.js
var require_settings = __commonJS({
  "../node_modules/@nodelib/fs.stat/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fs = require_fs2();
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.followSymbolicLink = this._getValue(this._options.followSymbolicLink, true);
        this.fs = fs.createFileSystemAdapter(this._options.fs);
        this.markSymbolicLink = this._getValue(this._options.markSymbolicLink, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports2.default = Settings;
  }
});

// ../node_modules/@nodelib/fs.stat/out/index.js
var require_out = __commonJS({
  "../node_modules/@nodelib/fs.stat/out/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.statSync = exports2.stat = exports2.Settings = void 0;
    var async = require_async();
    var sync = require_sync();
    var settings_1 = require_settings();
    exports2.Settings = settings_1.default;
    function stat(path, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        async.read(path, getSettings(), optionsOrSettingsOrCallback);
        return;
      }
      async.read(path, getSettings(optionsOrSettingsOrCallback), callback);
    }
    exports2.stat = stat;
    function statSync3(path, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      return sync.read(path, settings);
    }
    exports2.statSync = statSync3;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// ../node_modules/queue-microtask/index.js
var require_queue_microtask = __commonJS({
  "../node_modules/queue-microtask/index.js"(exports2, module2) {
    var promise;
    module2.exports = typeof queueMicrotask === "function" ? queueMicrotask.bind(typeof window !== "undefined" ? window : global) : (cb) => (promise || (promise = Promise.resolve())).then(cb).catch((err) => setTimeout(() => {
      throw err;
    }, 0));
  }
});

// ../node_modules/run-parallel/index.js
var require_run_parallel = __commonJS({
  "../node_modules/run-parallel/index.js"(exports2, module2) {
    module2.exports = runParallel;
    var queueMicrotask2 = require_queue_microtask();
    function runParallel(tasks, cb) {
      let results, pending, keys;
      let isSync = true;
      if (Array.isArray(tasks)) {
        results = [];
        pending = tasks.length;
      } else {
        keys = Object.keys(tasks);
        results = {};
        pending = keys.length;
      }
      function done(err) {
        function end() {
          if (cb) cb(err, results);
          cb = null;
        }
        if (isSync) queueMicrotask2(end);
        else end();
      }
      function each(i2, err, result) {
        results[i2] = result;
        if (--pending === 0 || err) {
          done(err);
        }
      }
      if (!pending) {
        done(null);
      } else if (keys) {
        keys.forEach(function(key) {
          tasks[key](function(err, result) {
            each(key, err, result);
          });
        });
      } else {
        tasks.forEach(function(task, i2) {
          task(function(err, result) {
            each(i2, err, result);
          });
        });
      }
      isSync = false;
    }
  }
});

// ../node_modules/@nodelib/fs.scandir/out/constants.js
var require_constants3 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.IS_SUPPORT_READDIR_WITH_FILE_TYPES = void 0;
    var NODE_PROCESS_VERSION_PARTS = process.versions.node.split(".");
    if (NODE_PROCESS_VERSION_PARTS[0] === void 0 || NODE_PROCESS_VERSION_PARTS[1] === void 0) {
      throw new Error(`Unexpected behavior. The 'process.versions.node' variable has invalid value: ${process.versions.node}`);
    }
    var MAJOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[0], 10);
    var MINOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[1], 10);
    var SUPPORTED_MAJOR_VERSION = 10;
    var SUPPORTED_MINOR_VERSION = 10;
    var IS_MATCHED_BY_MAJOR = MAJOR_VERSION > SUPPORTED_MAJOR_VERSION;
    var IS_MATCHED_BY_MAJOR_AND_MINOR = MAJOR_VERSION === SUPPORTED_MAJOR_VERSION && MINOR_VERSION >= SUPPORTED_MINOR_VERSION;
    exports2.IS_SUPPORT_READDIR_WITH_FILE_TYPES = IS_MATCHED_BY_MAJOR || IS_MATCHED_BY_MAJOR_AND_MINOR;
  }
});

// ../node_modules/@nodelib/fs.scandir/out/utils/fs.js
var require_fs3 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/utils/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createDirentFromStats = void 0;
    var DirentFromStats = class {
      constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
      }
    };
    function createDirentFromStats(name, stats) {
      return new DirentFromStats(name, stats);
    }
    exports2.createDirentFromStats = createDirentFromStats;
  }
});

// ../node_modules/@nodelib/fs.scandir/out/utils/index.js
var require_utils4 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/utils/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fs = void 0;
    var fs = require_fs3();
    exports2.fs = fs;
  }
});

// ../node_modules/@nodelib/fs.scandir/out/providers/common.js
var require_common = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/providers/common.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.joinPathSegments = void 0;
    function joinPathSegments(a2, b2, separator) {
      if (a2.endsWith(separator)) {
        return a2 + b2;
      }
      return a2 + separator + b2;
    }
    exports2.joinPathSegments = joinPathSegments;
  }
});

// ../node_modules/@nodelib/fs.scandir/out/providers/async.js
var require_async2 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.readdir = exports2.readdirWithFileTypes = exports2.read = void 0;
    var fsStat = require_out();
    var rpl = require_run_parallel();
    var constants_1 = require_constants3();
    var utils = require_utils4();
    var common = require_common();
    function read(directory, settings, callback) {
      if (!settings.stats && constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        readdirWithFileTypes(directory, settings, callback);
        return;
      }
      readdir(directory, settings, callback);
    }
    exports2.read = read;
    function readdirWithFileTypes(directory, settings, callback) {
      settings.fs.readdir(directory, { withFileTypes: true }, (readdirError, dirents) => {
        if (readdirError !== null) {
          callFailureCallback(callback, readdirError);
          return;
        }
        const entries = dirents.map((dirent) => ({
          dirent,
          name: dirent.name,
          path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        }));
        if (!settings.followSymbolicLinks) {
          callSuccessCallback(callback, entries);
          return;
        }
        const tasks = entries.map((entry) => makeRplTaskEntry(entry, settings));
        rpl(tasks, (rplError, rplEntries) => {
          if (rplError !== null) {
            callFailureCallback(callback, rplError);
            return;
          }
          callSuccessCallback(callback, rplEntries);
        });
      });
    }
    exports2.readdirWithFileTypes = readdirWithFileTypes;
    function makeRplTaskEntry(entry, settings) {
      return (done) => {
        if (!entry.dirent.isSymbolicLink()) {
          done(null, entry);
          return;
        }
        settings.fs.stat(entry.path, (statError, stats) => {
          if (statError !== null) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              done(statError);
              return;
            }
            done(null, entry);
            return;
          }
          entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
          done(null, entry);
        });
      };
    }
    function readdir(directory, settings, callback) {
      settings.fs.readdir(directory, (readdirError, names) => {
        if (readdirError !== null) {
          callFailureCallback(callback, readdirError);
          return;
        }
        const tasks = names.map((name) => {
          const path = common.joinPathSegments(directory, name, settings.pathSegmentSeparator);
          return (done) => {
            fsStat.stat(path, settings.fsStatSettings, (error, stats) => {
              if (error !== null) {
                done(error);
                return;
              }
              const entry = {
                name,
                path,
                dirent: utils.fs.createDirentFromStats(name, stats)
              };
              if (settings.stats) {
                entry.stats = stats;
              }
              done(null, entry);
            });
          };
        });
        rpl(tasks, (rplError, entries) => {
          if (rplError !== null) {
            callFailureCallback(callback, rplError);
            return;
          }
          callSuccessCallback(callback, entries);
        });
      });
    }
    exports2.readdir = readdir;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, result) {
      callback(null, result);
    }
  }
});

// ../node_modules/@nodelib/fs.scandir/out/providers/sync.js
var require_sync2 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.readdir = exports2.readdirWithFileTypes = exports2.read = void 0;
    var fsStat = require_out();
    var constants_1 = require_constants3();
    var utils = require_utils4();
    var common = require_common();
    function read(directory, settings) {
      if (!settings.stats && constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        return readdirWithFileTypes(directory, settings);
      }
      return readdir(directory, settings);
    }
    exports2.read = read;
    function readdirWithFileTypes(directory, settings) {
      const dirents = settings.fs.readdirSync(directory, { withFileTypes: true });
      return dirents.map((dirent) => {
        const entry = {
          dirent,
          name: dirent.name,
          path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        };
        if (entry.dirent.isSymbolicLink() && settings.followSymbolicLinks) {
          try {
            const stats = settings.fs.statSync(entry.path);
            entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
          } catch (error) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              throw error;
            }
          }
        }
        return entry;
      });
    }
    exports2.readdirWithFileTypes = readdirWithFileTypes;
    function readdir(directory, settings) {
      const names = settings.fs.readdirSync(directory);
      return names.map((name) => {
        const entryPath = common.joinPathSegments(directory, name, settings.pathSegmentSeparator);
        const stats = fsStat.statSync(entryPath, settings.fsStatSettings);
        const entry = {
          name,
          path: entryPath,
          dirent: utils.fs.createDirentFromStats(name, stats)
        };
        if (settings.stats) {
          entry.stats = stats;
        }
        return entry;
      });
    }
    exports2.readdir = readdir;
  }
});

// ../node_modules/@nodelib/fs.scandir/out/adapters/fs.js
var require_fs4 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/adapters/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createFileSystemAdapter = exports2.FILE_SYSTEM_ADAPTER = void 0;
    var fs = require("fs");
    exports2.FILE_SYSTEM_ADAPTER = {
      lstat: fs.lstat,
      stat: fs.stat,
      lstatSync: fs.lstatSync,
      statSync: fs.statSync,
      readdir: fs.readdir,
      readdirSync: fs.readdirSync
    };
    function createFileSystemAdapter(fsMethods) {
      if (fsMethods === void 0) {
        return exports2.FILE_SYSTEM_ADAPTER;
      }
      return Object.assign(Object.assign({}, exports2.FILE_SYSTEM_ADAPTER), fsMethods);
    }
    exports2.createFileSystemAdapter = createFileSystemAdapter;
  }
});

// ../node_modules/@nodelib/fs.scandir/out/settings.js
var require_settings2 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var fsStat = require_out();
    var fs = require_fs4();
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, false);
        this.fs = fs.createFileSystemAdapter(this._options.fs);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path.sep);
        this.stats = this._getValue(this._options.stats, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
        this.fsStatSettings = new fsStat.Settings({
          followSymbolicLink: this.followSymbolicLinks,
          fs: this.fs,
          throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink
        });
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports2.default = Settings;
  }
});

// ../node_modules/@nodelib/fs.scandir/out/index.js
var require_out2 = __commonJS({
  "../node_modules/@nodelib/fs.scandir/out/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Settings = exports2.scandirSync = exports2.scandir = void 0;
    var async = require_async2();
    var sync = require_sync2();
    var settings_1 = require_settings2();
    exports2.Settings = settings_1.default;
    function scandir(path, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        async.read(path, getSettings(), optionsOrSettingsOrCallback);
        return;
      }
      async.read(path, getSettings(optionsOrSettingsOrCallback), callback);
    }
    exports2.scandir = scandir;
    function scandirSync(path, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      return sync.read(path, settings);
    }
    exports2.scandirSync = scandirSync;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// ../node_modules/reusify/reusify.js
var require_reusify = __commonJS({
  "../node_modules/reusify/reusify.js"(exports2, module2) {
    "use strict";
    function reusify(Constructor) {
      var head = new Constructor();
      var tail = head;
      function get() {
        var current = head;
        if (current.next) {
          head = current.next;
        } else {
          head = new Constructor();
          tail = head;
        }
        current.next = null;
        return current;
      }
      function release(obj) {
        tail.next = obj;
        tail = obj;
      }
      return {
        get,
        release
      };
    }
    module2.exports = reusify;
  }
});

// ../node_modules/fastq/queue.js
var require_queue = __commonJS({
  "../node_modules/fastq/queue.js"(exports2, module2) {
    "use strict";
    var reusify = require_reusify();
    function fastqueue(context, worker, _concurrency) {
      if (typeof context === "function") {
        _concurrency = worker;
        worker = context;
        context = null;
      }
      if (!(_concurrency >= 1)) {
        throw new Error("fastqueue concurrency must be equal to or greater than 1");
      }
      var cache = reusify(Task);
      var queueHead = null;
      var queueTail = null;
      var _running = 0;
      var errorHandler = null;
      var self = {
        push,
        drain: noop,
        saturated: noop,
        pause,
        paused: false,
        get concurrency() {
          return _concurrency;
        },
        set concurrency(value) {
          if (!(value >= 1)) {
            throw new Error("fastqueue concurrency must be equal to or greater than 1");
          }
          _concurrency = value;
          if (self.paused) return;
          for (; queueHead && _running < _concurrency; ) {
            _running++;
            release();
          }
        },
        running,
        resume,
        idle,
        length,
        getQueue,
        unshift,
        empty: noop,
        kill,
        killAndDrain,
        error,
        abort
      };
      return self;
      function running() {
        return _running;
      }
      function pause() {
        self.paused = true;
      }
      function length() {
        var current = queueHead;
        var counter = 0;
        while (current) {
          current = current.next;
          counter++;
        }
        return counter;
      }
      function getQueue() {
        var current = queueHead;
        var tasks = [];
        while (current) {
          tasks.push(current.value);
          current = current.next;
        }
        return tasks;
      }
      function resume() {
        if (!self.paused) return;
        self.paused = false;
        if (queueHead === null) {
          _running++;
          release();
          return;
        }
        for (; queueHead && _running < _concurrency; ) {
          _running++;
          release();
        }
      }
      function idle() {
        return _running === 0 && self.length() === 0;
      }
      function push(value, done) {
        var current = cache.get();
        current.context = context;
        current.release = release;
        current.value = value;
        current.callback = done || noop;
        current.errorHandler = errorHandler;
        if (_running >= _concurrency || self.paused) {
          if (queueTail) {
            queueTail.next = current;
            queueTail = current;
          } else {
            queueHead = current;
            queueTail = current;
            self.saturated();
          }
        } else {
          _running++;
          worker.call(context, current.value, current.worked);
        }
      }
      function unshift(value, done) {
        var current = cache.get();
        current.context = context;
        current.release = release;
        current.value = value;
        current.callback = done || noop;
        current.errorHandler = errorHandler;
        if (_running >= _concurrency || self.paused) {
          if (queueHead) {
            current.next = queueHead;
            queueHead = current;
          } else {
            queueHead = current;
            queueTail = current;
            self.saturated();
          }
        } else {
          _running++;
          worker.call(context, current.value, current.worked);
        }
      }
      function release(holder) {
        if (holder) {
          cache.release(holder);
        }
        var next = queueHead;
        if (next && _running <= _concurrency) {
          if (!self.paused) {
            if (queueTail === queueHead) {
              queueTail = null;
            }
            queueHead = next.next;
            next.next = null;
            worker.call(context, next.value, next.worked);
            if (queueTail === null) {
              self.empty();
            }
          } else {
            _running--;
          }
        } else if (--_running === 0) {
          self.drain();
        }
      }
      function kill() {
        queueHead = null;
        queueTail = null;
        self.drain = noop;
      }
      function killAndDrain() {
        queueHead = null;
        queueTail = null;
        self.drain();
        self.drain = noop;
      }
      function abort() {
        var current = queueHead;
        queueHead = null;
        queueTail = null;
        while (current) {
          var next = current.next;
          var callback = current.callback;
          var errorHandler2 = current.errorHandler;
          var val = current.value;
          var context2 = current.context;
          current.value = null;
          current.callback = noop;
          current.errorHandler = null;
          current.next = null;
          if (errorHandler2) {
            errorHandler2(new Error("abort"), val);
          }
          callback.call(context2, new Error("abort"));
          cache.release(current);
          current = next;
        }
        self.drain = noop;
      }
      function error(handler) {
        errorHandler = handler;
      }
    }
    function noop() {
    }
    function Task() {
      this.value = null;
      this.callback = noop;
      this.next = null;
      this.release = noop;
      this.context = null;
      this.errorHandler = null;
      var self = this;
      this.worked = function worked(err, result) {
        var callback = self.callback;
        var errorHandler = self.errorHandler;
        var val = self.value;
        self.value = null;
        self.callback = noop;
        if (self.errorHandler) {
          errorHandler(err, val);
        }
        callback.call(self.context, err, result);
        self.release(self);
      };
    }
    function queueAsPromised(context, worker, _concurrency) {
      if (typeof context === "function") {
        _concurrency = worker;
        worker = context;
        context = null;
      }
      function asyncWrapper(arg, cb) {
        worker.call(this, arg).then(function(res) {
          cb(null, res);
        }, cb);
      }
      var queue = fastqueue(context, asyncWrapper, _concurrency);
      var pushCb = queue.push;
      var unshiftCb = queue.unshift;
      queue.push = push;
      queue.unshift = unshift;
      queue.drained = drained;
      return queue;
      function push(value) {
        var p2 = new Promise(function(resolve2, reject) {
          pushCb(value, function(err, result) {
            if (err) {
              reject(err);
              return;
            }
            resolve2(result);
          });
        });
        p2.catch(noop);
        return p2;
      }
      function unshift(value) {
        var p2 = new Promise(function(resolve2, reject) {
          unshiftCb(value, function(err, result) {
            if (err) {
              reject(err);
              return;
            }
            resolve2(result);
          });
        });
        p2.catch(noop);
        return p2;
      }
      function drained() {
        var p2 = new Promise(function(resolve2) {
          process.nextTick(function() {
            if (queue.idle()) {
              resolve2();
            } else {
              var previousDrain = queue.drain;
              queue.drain = function() {
                if (typeof previousDrain === "function") previousDrain();
                resolve2();
                queue.drain = previousDrain;
              };
            }
          });
        });
        return p2;
      }
    }
    module2.exports = fastqueue;
    module2.exports.promise = queueAsPromised;
  }
});

// ../node_modules/@nodelib/fs.walk/out/readers/common.js
var require_common2 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/readers/common.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.joinPathSegments = exports2.replacePathSegmentSeparator = exports2.isAppliedFilter = exports2.isFatalError = void 0;
    function isFatalError(settings, error) {
      if (settings.errorFilter === null) {
        return true;
      }
      return !settings.errorFilter(error);
    }
    exports2.isFatalError = isFatalError;
    function isAppliedFilter(filter, value) {
      return filter === null || filter(value);
    }
    exports2.isAppliedFilter = isAppliedFilter;
    function replacePathSegmentSeparator(filepath, separator) {
      return filepath.split(/[/\\]/).join(separator);
    }
    exports2.replacePathSegmentSeparator = replacePathSegmentSeparator;
    function joinPathSegments(a2, b2, separator) {
      if (a2 === "") {
        return b2;
      }
      if (a2.endsWith(separator)) {
        return a2 + b2;
      }
      return a2 + separator + b2;
    }
    exports2.joinPathSegments = joinPathSegments;
  }
});

// ../node_modules/@nodelib/fs.walk/out/readers/reader.js
var require_reader = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/readers/reader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var common = require_common2();
    var Reader = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._root = common.replacePathSegmentSeparator(_root, _settings.pathSegmentSeparator);
      }
    };
    exports2.default = Reader;
  }
});

// ../node_modules/@nodelib/fs.walk/out/readers/async.js
var require_async3 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/readers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var events_1 = require("events");
    var fsScandir = require_out2();
    var fastq = require_queue();
    var common = require_common2();
    var reader_1 = require_reader();
    var AsyncReader = class extends reader_1.default {
      constructor(_root, _settings) {
        super(_root, _settings);
        this._settings = _settings;
        this._scandir = fsScandir.scandir;
        this._emitter = new events_1.EventEmitter();
        this._queue = fastq(this._worker.bind(this), this._settings.concurrency);
        this._isFatalError = false;
        this._isDestroyed = false;
        this._queue.drain = () => {
          if (!this._isFatalError) {
            this._emitter.emit("end");
          }
        };
      }
      read() {
        this._isFatalError = false;
        this._isDestroyed = false;
        setImmediate(() => {
          this._pushToQueue(this._root, this._settings.basePath);
        });
        return this._emitter;
      }
      get isDestroyed() {
        return this._isDestroyed;
      }
      destroy() {
        if (this._isDestroyed) {
          throw new Error("The reader is already destroyed");
        }
        this._isDestroyed = true;
        this._queue.killAndDrain();
      }
      onEntry(callback) {
        this._emitter.on("entry", callback);
      }
      onError(callback) {
        this._emitter.once("error", callback);
      }
      onEnd(callback) {
        this._emitter.once("end", callback);
      }
      _pushToQueue(directory, base) {
        const queueItem = { directory, base };
        this._queue.push(queueItem, (error) => {
          if (error !== null) {
            this._handleError(error);
          }
        });
      }
      _worker(item, done) {
        this._scandir(item.directory, this._settings.fsScandirSettings, (error, entries) => {
          if (error !== null) {
            done(error, void 0);
            return;
          }
          for (const entry of entries) {
            this._handleEntry(entry, item.base);
          }
          done(null, void 0);
        });
      }
      _handleError(error) {
        if (this._isDestroyed || !common.isFatalError(this._settings, error)) {
          return;
        }
        this._isFatalError = true;
        this._isDestroyed = true;
        this._emitter.emit("error", error);
      }
      _handleEntry(entry, base) {
        if (this._isDestroyed || this._isFatalError) {
          return;
        }
        const fullpath = entry.path;
        if (base !== void 0) {
          entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
          this._emitEntry(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
          this._pushToQueue(fullpath, base === void 0 ? void 0 : entry.path);
        }
      }
      _emitEntry(entry) {
        this._emitter.emit("entry", entry);
      }
    };
    exports2.default = AsyncReader;
  }
});

// ../node_modules/@nodelib/fs.walk/out/providers/async.js
var require_async4 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var async_1 = require_async3();
    var AsyncProvider = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new async_1.default(this._root, this._settings);
        this._storage = [];
      }
      read(callback) {
        this._reader.onError((error) => {
          callFailureCallback(callback, error);
        });
        this._reader.onEntry((entry) => {
          this._storage.push(entry);
        });
        this._reader.onEnd(() => {
          callSuccessCallback(callback, this._storage);
        });
        this._reader.read();
      }
    };
    exports2.default = AsyncProvider;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, entries) {
      callback(null, entries);
    }
  }
});

// ../node_modules/@nodelib/fs.walk/out/providers/stream.js
var require_stream2 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/providers/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var async_1 = require_async3();
    var StreamProvider = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new async_1.default(this._root, this._settings);
        this._stream = new stream_1.Readable({
          objectMode: true,
          read: () => {
          },
          destroy: () => {
            if (!this._reader.isDestroyed) {
              this._reader.destroy();
            }
          }
        });
      }
      read() {
        this._reader.onError((error) => {
          this._stream.emit("error", error);
        });
        this._reader.onEntry((entry) => {
          this._stream.push(entry);
        });
        this._reader.onEnd(() => {
          this._stream.push(null);
        });
        this._reader.read();
        return this._stream;
      }
    };
    exports2.default = StreamProvider;
  }
});

// ../node_modules/@nodelib/fs.walk/out/readers/sync.js
var require_sync3 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/readers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fsScandir = require_out2();
    var common = require_common2();
    var reader_1 = require_reader();
    var SyncReader = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._scandir = fsScandir.scandirSync;
        this._storage = [];
        this._queue = /* @__PURE__ */ new Set();
      }
      read() {
        this._pushToQueue(this._root, this._settings.basePath);
        this._handleQueue();
        return this._storage;
      }
      _pushToQueue(directory, base) {
        this._queue.add({ directory, base });
      }
      _handleQueue() {
        for (const item of this._queue.values()) {
          this._handleDirectory(item.directory, item.base);
        }
      }
      _handleDirectory(directory, base) {
        try {
          const entries = this._scandir(directory, this._settings.fsScandirSettings);
          for (const entry of entries) {
            this._handleEntry(entry, base);
          }
        } catch (error) {
          this._handleError(error);
        }
      }
      _handleError(error) {
        if (!common.isFatalError(this._settings, error)) {
          return;
        }
        throw error;
      }
      _handleEntry(entry, base) {
        const fullpath = entry.path;
        if (base !== void 0) {
          entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
          this._pushToStorage(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
          this._pushToQueue(fullpath, base === void 0 ? void 0 : entry.path);
        }
      }
      _pushToStorage(entry) {
        this._storage.push(entry);
      }
    };
    exports2.default = SyncReader;
  }
});

// ../node_modules/@nodelib/fs.walk/out/providers/sync.js
var require_sync4 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var sync_1 = require_sync3();
    var SyncProvider = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new sync_1.default(this._root, this._settings);
      }
      read() {
        return this._reader.read();
      }
    };
    exports2.default = SyncProvider;
  }
});

// ../node_modules/@nodelib/fs.walk/out/settings.js
var require_settings3 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var fsScandir = require_out2();
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.basePath = this._getValue(this._options.basePath, void 0);
        this.concurrency = this._getValue(this._options.concurrency, Number.POSITIVE_INFINITY);
        this.deepFilter = this._getValue(this._options.deepFilter, null);
        this.entryFilter = this._getValue(this._options.entryFilter, null);
        this.errorFilter = this._getValue(this._options.errorFilter, null);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path.sep);
        this.fsScandirSettings = new fsScandir.Settings({
          followSymbolicLinks: this._options.followSymbolicLinks,
          fs: this._options.fs,
          pathSegmentSeparator: this._options.pathSegmentSeparator,
          stats: this._options.stats,
          throwErrorOnBrokenSymbolicLink: this._options.throwErrorOnBrokenSymbolicLink
        });
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports2.default = Settings;
  }
});

// ../node_modules/@nodelib/fs.walk/out/index.js
var require_out3 = __commonJS({
  "../node_modules/@nodelib/fs.walk/out/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Settings = exports2.walkStream = exports2.walkSync = exports2.walk = void 0;
    var async_1 = require_async4();
    var stream_1 = require_stream2();
    var sync_1 = require_sync4();
    var settings_1 = require_settings3();
    exports2.Settings = settings_1.default;
    function walk(directory, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        new async_1.default(directory, getSettings()).read(optionsOrSettingsOrCallback);
        return;
      }
      new async_1.default(directory, getSettings(optionsOrSettingsOrCallback)).read(callback);
    }
    exports2.walk = walk;
    function walkSync(directory, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      const provider = new sync_1.default(directory, settings);
      return provider.read();
    }
    exports2.walkSync = walkSync;
    function walkStream(directory, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      const provider = new stream_1.default(directory, settings);
      return provider.read();
    }
    exports2.walkStream = walkStream;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// ../node_modules/fast-glob/out/readers/reader.js
var require_reader2 = __commonJS({
  "../node_modules/fast-glob/out/readers/reader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var fsStat = require_out();
    var utils = require_utils3();
    var Reader = class {
      constructor(_settings) {
        this._settings = _settings;
        this._fsStatSettings = new fsStat.Settings({
          followSymbolicLink: this._settings.followSymbolicLinks,
          fs: this._settings.fs,
          throwErrorOnBrokenSymbolicLink: this._settings.followSymbolicLinks
        });
      }
      _getFullEntryPath(filepath) {
        return path.resolve(this._settings.cwd, filepath);
      }
      _makeEntry(stats, pattern) {
        const entry = {
          name: pattern,
          path: pattern,
          dirent: utils.fs.createDirentFromStats(pattern, stats)
        };
        if (this._settings.stats) {
          entry.stats = stats;
        }
        return entry;
      }
      _isFatalError(error) {
        return !utils.errno.isEnoentCodeError(error) && !this._settings.suppressErrors;
      }
    };
    exports2.default = Reader;
  }
});

// ../node_modules/fast-glob/out/readers/stream.js
var require_stream3 = __commonJS({
  "../node_modules/fast-glob/out/readers/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var fsStat = require_out();
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var ReaderStream = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkStream = fsWalk.walkStream;
        this._stat = fsStat.stat;
      }
      dynamic(root, options) {
        return this._walkStream(root, options);
      }
      static(patterns, options) {
        const filepaths = patterns.map(this._getFullEntryPath, this);
        const stream = new stream_1.PassThrough({ objectMode: true });
        stream._write = (index, _enc, done) => {
          return this._getEntry(filepaths[index], patterns[index], options).then((entry) => {
            if (entry !== null && options.entryFilter(entry)) {
              stream.push(entry);
            }
            if (index === filepaths.length - 1) {
              stream.end();
            }
            done();
          }).catch(done);
        };
        for (let i2 = 0; i2 < filepaths.length; i2++) {
          stream.write(i2);
        }
        return stream;
      }
      _getEntry(filepath, pattern, options) {
        return this._getStat(filepath).then((stats) => this._makeEntry(stats, pattern)).catch((error) => {
          if (options.errorFilter(error)) {
            return null;
          }
          throw error;
        });
      }
      _getStat(filepath) {
        return new Promise((resolve2, reject) => {
          this._stat(filepath, this._fsStatSettings, (error, stats) => {
            return error === null ? resolve2(stats) : reject(error);
          });
        });
      }
    };
    exports2.default = ReaderStream;
  }
});

// ../node_modules/fast-glob/out/readers/async.js
var require_async5 = __commonJS({
  "../node_modules/fast-glob/out/readers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var stream_1 = require_stream3();
    var ReaderAsync = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkAsync = fsWalk.walk;
        this._readerStream = new stream_1.default(this._settings);
      }
      dynamic(root, options) {
        return new Promise((resolve2, reject) => {
          this._walkAsync(root, options, (error, entries) => {
            if (error === null) {
              resolve2(entries);
            } else {
              reject(error);
            }
          });
        });
      }
      async static(patterns, options) {
        const entries = [];
        const stream = this._readerStream.static(patterns, options);
        return new Promise((resolve2, reject) => {
          stream.once("error", reject);
          stream.on("data", (entry) => entries.push(entry));
          stream.once("end", () => resolve2(entries));
        });
      }
    };
    exports2.default = ReaderAsync;
  }
});

// ../node_modules/fast-glob/out/providers/matchers/matcher.js
var require_matcher = __commonJS({
  "../node_modules/fast-glob/out/providers/matchers/matcher.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var Matcher = class {
      constructor(_patterns, _settings, _micromatchOptions) {
        this._patterns = _patterns;
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this._storage = [];
        this._fillStorage();
      }
      _fillStorage() {
        for (const pattern of this._patterns) {
          const segments = this._getPatternSegments(pattern);
          const sections = this._splitSegmentsIntoSections(segments);
          this._storage.push({
            complete: sections.length <= 1,
            pattern,
            segments,
            sections
          });
        }
      }
      _getPatternSegments(pattern) {
        const parts = utils.pattern.getPatternParts(pattern, this._micromatchOptions);
        return parts.map((part) => {
          const dynamic = utils.pattern.isDynamicPattern(part, this._settings);
          if (!dynamic) {
            return {
              dynamic: false,
              pattern: part
            };
          }
          return {
            dynamic: true,
            pattern: part,
            patternRe: utils.pattern.makeRe(part, this._micromatchOptions)
          };
        });
      }
      _splitSegmentsIntoSections(segments) {
        return utils.array.splitWhen(segments, (segment) => segment.dynamic && utils.pattern.hasGlobStar(segment.pattern));
      }
    };
    exports2.default = Matcher;
  }
});

// ../node_modules/fast-glob/out/providers/matchers/partial.js
var require_partial = __commonJS({
  "../node_modules/fast-glob/out/providers/matchers/partial.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var matcher_1 = require_matcher();
    var PartialMatcher = class extends matcher_1.default {
      match(filepath) {
        const parts = filepath.split("/");
        const levels = parts.length;
        const patterns = this._storage.filter((info) => !info.complete || info.segments.length > levels);
        for (const pattern of patterns) {
          const section = pattern.sections[0];
          if (!pattern.complete && levels > section.length) {
            return true;
          }
          const match = parts.every((part, index) => {
            const segment = pattern.segments[index];
            if (segment.dynamic && segment.patternRe.test(part)) {
              return true;
            }
            if (!segment.dynamic && segment.pattern === part) {
              return true;
            }
            return false;
          });
          if (match) {
            return true;
          }
        }
        return false;
      }
    };
    exports2.default = PartialMatcher;
  }
});

// ../node_modules/fast-glob/out/providers/filters/deep.js
var require_deep = __commonJS({
  "../node_modules/fast-glob/out/providers/filters/deep.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var partial_1 = require_partial();
    var DeepFilter = class {
      constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
      }
      getFilter(basePath, positive, negative) {
        const matcher = this._getMatcher(positive);
        const negativeRe = this._getNegativePatternsRe(negative);
        return (entry) => this._filter(basePath, entry, matcher, negativeRe);
      }
      _getMatcher(patterns) {
        return new partial_1.default(patterns, this._settings, this._micromatchOptions);
      }
      _getNegativePatternsRe(patterns) {
        const affectDepthOfReadingPatterns = patterns.filter(utils.pattern.isAffectDepthOfReadingPattern);
        return utils.pattern.convertPatternsToRe(affectDepthOfReadingPatterns, this._micromatchOptions);
      }
      _filter(basePath, entry, matcher, negativeRe) {
        if (this._isSkippedByDeep(basePath, entry.path)) {
          return false;
        }
        if (this._isSkippedSymbolicLink(entry)) {
          return false;
        }
        const filepath = utils.path.removeLeadingDotSegment(entry.path);
        if (this._isSkippedByPositivePatterns(filepath, matcher)) {
          return false;
        }
        return this._isSkippedByNegativePatterns(filepath, negativeRe);
      }
      _isSkippedByDeep(basePath, entryPath) {
        if (this._settings.deep === Infinity) {
          return false;
        }
        return this._getEntryLevel(basePath, entryPath) >= this._settings.deep;
      }
      _getEntryLevel(basePath, entryPath) {
        const entryPathDepth = entryPath.split("/").length;
        if (basePath === "") {
          return entryPathDepth;
        }
        const basePathDepth = basePath.split("/").length;
        return entryPathDepth - basePathDepth;
      }
      _isSkippedSymbolicLink(entry) {
        return !this._settings.followSymbolicLinks && entry.dirent.isSymbolicLink();
      }
      _isSkippedByPositivePatterns(entryPath, matcher) {
        return !this._settings.baseNameMatch && !matcher.match(entryPath);
      }
      _isSkippedByNegativePatterns(entryPath, patternsRe) {
        return !utils.pattern.matchAny(entryPath, patternsRe);
      }
    };
    exports2.default = DeepFilter;
  }
});

// ../node_modules/fast-glob/out/providers/filters/entry.js
var require_entry = __commonJS({
  "../node_modules/fast-glob/out/providers/filters/entry.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var EntryFilter = class {
      constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this.index = /* @__PURE__ */ new Map();
      }
      getFilter(positive, negative) {
        const [absoluteNegative, relativeNegative] = utils.pattern.partitionAbsoluteAndRelative(negative);
        const patterns = {
          positive: {
            all: utils.pattern.convertPatternsToRe(positive, this._micromatchOptions)
          },
          negative: {
            absolute: utils.pattern.convertPatternsToRe(absoluteNegative, Object.assign(Object.assign({}, this._micromatchOptions), { dot: true })),
            relative: utils.pattern.convertPatternsToRe(relativeNegative, Object.assign(Object.assign({}, this._micromatchOptions), { dot: true }))
          }
        };
        return (entry) => this._filter(entry, patterns);
      }
      _filter(entry, patterns) {
        const filepath = utils.path.removeLeadingDotSegment(entry.path);
        if (this._settings.unique && this._isDuplicateEntry(filepath)) {
          return false;
        }
        if (this._onlyFileFilter(entry) || this._onlyDirectoryFilter(entry)) {
          return false;
        }
        const isMatched = this._isMatchToPatternsSet(filepath, patterns, entry.dirent.isDirectory());
        if (this._settings.unique && isMatched) {
          this._createIndexRecord(filepath);
        }
        return isMatched;
      }
      _isDuplicateEntry(filepath) {
        return this.index.has(filepath);
      }
      _createIndexRecord(filepath) {
        this.index.set(filepath, void 0);
      }
      _onlyFileFilter(entry) {
        return this._settings.onlyFiles && !entry.dirent.isFile();
      }
      _onlyDirectoryFilter(entry) {
        return this._settings.onlyDirectories && !entry.dirent.isDirectory();
      }
      _isMatchToPatternsSet(filepath, patterns, isDirectory) {
        const isMatched = this._isMatchToPatterns(filepath, patterns.positive.all, isDirectory);
        if (!isMatched) {
          return false;
        }
        const isMatchedByRelativeNegative = this._isMatchToPatterns(filepath, patterns.negative.relative, isDirectory);
        if (isMatchedByRelativeNegative) {
          return false;
        }
        const isMatchedByAbsoluteNegative = this._isMatchToAbsoluteNegative(filepath, patterns.negative.absolute, isDirectory);
        if (isMatchedByAbsoluteNegative) {
          return false;
        }
        return true;
      }
      _isMatchToAbsoluteNegative(filepath, patternsRe, isDirectory) {
        if (patternsRe.length === 0) {
          return false;
        }
        const fullpath = utils.path.makeAbsolute(this._settings.cwd, filepath);
        return this._isMatchToPatterns(fullpath, patternsRe, isDirectory);
      }
      _isMatchToPatterns(filepath, patternsRe, isDirectory) {
        if (patternsRe.length === 0) {
          return false;
        }
        const isMatched = utils.pattern.matchAny(filepath, patternsRe);
        if (!isMatched && isDirectory) {
          return utils.pattern.matchAny(filepath + "/", patternsRe);
        }
        return isMatched;
      }
    };
    exports2.default = EntryFilter;
  }
});

// ../node_modules/fast-glob/out/providers/filters/error.js
var require_error = __commonJS({
  "../node_modules/fast-glob/out/providers/filters/error.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var ErrorFilter = class {
      constructor(_settings) {
        this._settings = _settings;
      }
      getFilter() {
        return (error) => this._isNonFatalError(error);
      }
      _isNonFatalError(error) {
        return utils.errno.isEnoentCodeError(error) || this._settings.suppressErrors;
      }
    };
    exports2.default = ErrorFilter;
  }
});

// ../node_modules/fast-glob/out/providers/transformers/entry.js
var require_entry2 = __commonJS({
  "../node_modules/fast-glob/out/providers/transformers/entry.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var EntryTransformer = class {
      constructor(_settings) {
        this._settings = _settings;
      }
      getTransformer() {
        return (entry) => this._transform(entry);
      }
      _transform(entry) {
        let filepath = entry.path;
        if (this._settings.absolute) {
          filepath = utils.path.makeAbsolute(this._settings.cwd, filepath);
          filepath = utils.path.unixify(filepath);
        }
        if (this._settings.markDirectories && entry.dirent.isDirectory()) {
          filepath += "/";
        }
        if (!this._settings.objectMode) {
          return filepath;
        }
        return Object.assign(Object.assign({}, entry), { path: filepath });
      }
    };
    exports2.default = EntryTransformer;
  }
});

// ../node_modules/fast-glob/out/providers/provider.js
var require_provider = __commonJS({
  "../node_modules/fast-glob/out/providers/provider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var deep_1 = require_deep();
    var entry_1 = require_entry();
    var error_1 = require_error();
    var entry_2 = require_entry2();
    var Provider = class {
      constructor(_settings) {
        this._settings = _settings;
        this.errorFilter = new error_1.default(this._settings);
        this.entryFilter = new entry_1.default(this._settings, this._getMicromatchOptions());
        this.deepFilter = new deep_1.default(this._settings, this._getMicromatchOptions());
        this.entryTransformer = new entry_2.default(this._settings);
      }
      _getRootDirectory(task) {
        return path.resolve(this._settings.cwd, task.base);
      }
      _getReaderOptions(task) {
        const basePath = task.base === "." ? "" : task.base;
        return {
          basePath,
          pathSegmentSeparator: "/",
          concurrency: this._settings.concurrency,
          deepFilter: this.deepFilter.getFilter(basePath, task.positive, task.negative),
          entryFilter: this.entryFilter.getFilter(task.positive, task.negative),
          errorFilter: this.errorFilter.getFilter(),
          followSymbolicLinks: this._settings.followSymbolicLinks,
          fs: this._settings.fs,
          stats: this._settings.stats,
          throwErrorOnBrokenSymbolicLink: this._settings.throwErrorOnBrokenSymbolicLink,
          transform: this.entryTransformer.getTransformer()
        };
      }
      _getMicromatchOptions() {
        return {
          dot: this._settings.dot,
          matchBase: this._settings.baseNameMatch,
          nobrace: !this._settings.braceExpansion,
          nocase: !this._settings.caseSensitiveMatch,
          noext: !this._settings.extglob,
          noglobstar: !this._settings.globstar,
          posix: true,
          strictSlashes: false
        };
      }
    };
    exports2.default = Provider;
  }
});

// ../node_modules/fast-glob/out/providers/async.js
var require_async6 = __commonJS({
  "../node_modules/fast-glob/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var async_1 = require_async5();
    var provider_1 = require_provider();
    var ProviderAsync = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new async_1.default(this._settings);
      }
      async read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const entries = await this.api(root, task, options);
        return entries.map((entry) => options.transform(entry));
      }
      api(root, task, options) {
        if (task.dynamic) {
          return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
      }
    };
    exports2.default = ProviderAsync;
  }
});

// ../node_modules/fast-glob/out/providers/stream.js
var require_stream4 = __commonJS({
  "../node_modules/fast-glob/out/providers/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var stream_2 = require_stream3();
    var provider_1 = require_provider();
    var ProviderStream = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new stream_2.default(this._settings);
      }
      read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const source = this.api(root, task, options);
        const destination = new stream_1.Readable({ objectMode: true, read: () => {
        } });
        source.once("error", (error) => destination.emit("error", error)).on("data", (entry) => destination.emit("data", options.transform(entry))).once("end", () => destination.emit("end"));
        destination.once("close", () => source.destroy());
        return destination;
      }
      api(root, task, options) {
        if (task.dynamic) {
          return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
      }
    };
    exports2.default = ProviderStream;
  }
});

// ../node_modules/fast-glob/out/readers/sync.js
var require_sync5 = __commonJS({
  "../node_modules/fast-glob/out/readers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fsStat = require_out();
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var ReaderSync = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkSync = fsWalk.walkSync;
        this._statSync = fsStat.statSync;
      }
      dynamic(root, options) {
        return this._walkSync(root, options);
      }
      static(patterns, options) {
        const entries = [];
        for (const pattern of patterns) {
          const filepath = this._getFullEntryPath(pattern);
          const entry = this._getEntry(filepath, pattern, options);
          if (entry === null || !options.entryFilter(entry)) {
            continue;
          }
          entries.push(entry);
        }
        return entries;
      }
      _getEntry(filepath, pattern, options) {
        try {
          const stats = this._getStat(filepath);
          return this._makeEntry(stats, pattern);
        } catch (error) {
          if (options.errorFilter(error)) {
            return null;
          }
          throw error;
        }
      }
      _getStat(filepath) {
        return this._statSync(filepath, this._fsStatSettings);
      }
    };
    exports2.default = ReaderSync;
  }
});

// ../node_modules/fast-glob/out/providers/sync.js
var require_sync6 = __commonJS({
  "../node_modules/fast-glob/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var sync_1 = require_sync5();
    var provider_1 = require_provider();
    var ProviderSync = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new sync_1.default(this._settings);
      }
      read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const entries = this.api(root, task, options);
        return entries.map(options.transform);
      }
      api(root, task, options) {
        if (task.dynamic) {
          return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
      }
    };
    exports2.default = ProviderSync;
  }
});

// ../node_modules/fast-glob/out/settings.js
var require_settings4 = __commonJS({
  "../node_modules/fast-glob/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DEFAULT_FILE_SYSTEM_ADAPTER = void 0;
    var fs = require("fs");
    var os = require("os");
    var CPU_COUNT = Math.max(os.cpus().length, 1);
    exports2.DEFAULT_FILE_SYSTEM_ADAPTER = {
      lstat: fs.lstat,
      lstatSync: fs.lstatSync,
      stat: fs.stat,
      statSync: fs.statSync,
      readdir: fs.readdir,
      readdirSync: fs.readdirSync
    };
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.absolute = this._getValue(this._options.absolute, false);
        this.baseNameMatch = this._getValue(this._options.baseNameMatch, false);
        this.braceExpansion = this._getValue(this._options.braceExpansion, true);
        this.caseSensitiveMatch = this._getValue(this._options.caseSensitiveMatch, true);
        this.concurrency = this._getValue(this._options.concurrency, CPU_COUNT);
        this.cwd = this._getValue(this._options.cwd, process.cwd());
        this.deep = this._getValue(this._options.deep, Infinity);
        this.dot = this._getValue(this._options.dot, false);
        this.extglob = this._getValue(this._options.extglob, true);
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, true);
        this.fs = this._getFileSystemMethods(this._options.fs);
        this.globstar = this._getValue(this._options.globstar, true);
        this.ignore = this._getValue(this._options.ignore, []);
        this.markDirectories = this._getValue(this._options.markDirectories, false);
        this.objectMode = this._getValue(this._options.objectMode, false);
        this.onlyDirectories = this._getValue(this._options.onlyDirectories, false);
        this.onlyFiles = this._getValue(this._options.onlyFiles, true);
        this.stats = this._getValue(this._options.stats, false);
        this.suppressErrors = this._getValue(this._options.suppressErrors, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, false);
        this.unique = this._getValue(this._options.unique, true);
        if (this.onlyDirectories) {
          this.onlyFiles = false;
        }
        if (this.stats) {
          this.objectMode = true;
        }
        this.ignore = [].concat(this.ignore);
      }
      _getValue(option, value) {
        return option === void 0 ? value : option;
      }
      _getFileSystemMethods(methods = {}) {
        return Object.assign(Object.assign({}, exports2.DEFAULT_FILE_SYSTEM_ADAPTER), methods);
      }
    };
    exports2.default = Settings;
  }
});

// ../node_modules/fast-glob/out/index.js
var require_out4 = __commonJS({
  "../node_modules/fast-glob/out/index.js"(exports2, module2) {
    "use strict";
    var taskManager = require_tasks();
    var async_1 = require_async6();
    var stream_1 = require_stream4();
    var sync_1 = require_sync6();
    var settings_1 = require_settings4();
    var utils = require_utils3();
    async function FastGlob(source, options) {
      assertPatternsInput(source);
      const works = getWorks(source, async_1.default, options);
      const result = await Promise.all(works);
      return utils.array.flatten(result);
    }
    (function(FastGlob2) {
      FastGlob2.glob = FastGlob2;
      FastGlob2.globSync = sync;
      FastGlob2.globStream = stream;
      FastGlob2.async = FastGlob2;
      function sync(source, options) {
        assertPatternsInput(source);
        const works = getWorks(source, sync_1.default, options);
        return utils.array.flatten(works);
      }
      FastGlob2.sync = sync;
      function stream(source, options) {
        assertPatternsInput(source);
        const works = getWorks(source, stream_1.default, options);
        return utils.stream.merge(works);
      }
      FastGlob2.stream = stream;
      function generateTasks(source, options) {
        assertPatternsInput(source);
        const patterns = [].concat(source);
        const settings = new settings_1.default(options);
        return taskManager.generate(patterns, settings);
      }
      FastGlob2.generateTasks = generateTasks;
      function isDynamicPattern(source, options) {
        assertPatternsInput(source);
        const settings = new settings_1.default(options);
        return utils.pattern.isDynamicPattern(source, settings);
      }
      FastGlob2.isDynamicPattern = isDynamicPattern;
      function escapePath(source) {
        assertPatternsInput(source);
        return utils.path.escape(source);
      }
      FastGlob2.escapePath = escapePath;
      function convertPathToPattern(source) {
        assertPatternsInput(source);
        return utils.path.convertPathToPattern(source);
      }
      FastGlob2.convertPathToPattern = convertPathToPattern;
      let posix;
      (function(posix2) {
        function escapePath2(source) {
          assertPatternsInput(source);
          return utils.path.escapePosixPath(source);
        }
        posix2.escapePath = escapePath2;
        function convertPathToPattern2(source) {
          assertPatternsInput(source);
          return utils.path.convertPosixPathToPattern(source);
        }
        posix2.convertPathToPattern = convertPathToPattern2;
      })(posix = FastGlob2.posix || (FastGlob2.posix = {}));
      let win32;
      (function(win322) {
        function escapePath2(source) {
          assertPatternsInput(source);
          return utils.path.escapeWindowsPath(source);
        }
        win322.escapePath = escapePath2;
        function convertPathToPattern2(source) {
          assertPatternsInput(source);
          return utils.path.convertWindowsPathToPattern(source);
        }
        win322.convertPathToPattern = convertPathToPattern2;
      })(win32 = FastGlob2.win32 || (FastGlob2.win32 = {}));
    })(FastGlob || (FastGlob = {}));
    function getWorks(source, _Provider, options) {
      const patterns = [].concat(source);
      const settings = new settings_1.default(options);
      const tasks = taskManager.generate(patterns, settings);
      const provider = new _Provider(settings);
      return tasks.map(provider.read, provider);
    }
    function assertPatternsInput(input) {
      const source = [].concat(input);
      const isValidSource = source.every((item) => utils.string.isString(item) && !utils.string.isEmpty(item));
      if (!isValidSource) {
        throw new TypeError("Patterns must be a string (non empty) or an array of strings");
      }
    }
    module2.exports = FastGlob;
  }
});

// ../node_modules/vscode-languageserver-textdocument/lib/esm/main.js
var FullTextDocument = class _FullTextDocument {
  constructor(uri, languageId, version, content) {
    this._uri = uri;
    this._languageId = languageId;
    this._version = version;
    this._content = content;
    this._lineOffsets = void 0;
  }
  get uri() {
    return this._uri;
  }
  get languageId() {
    return this._languageId;
  }
  get version() {
    return this._version;
  }
  getText(range) {
    if (range) {
      const start = this.offsetAt(range.start);
      const end = this.offsetAt(range.end);
      return this._content.substring(start, end);
    }
    return this._content;
  }
  update(changes, version) {
    for (const change of changes) {
      if (_FullTextDocument.isIncremental(change)) {
        const range = getWellformedRange(change.range);
        const startOffset = this.offsetAt(range.start);
        const endOffset = this.offsetAt(range.end);
        this._content = this._content.substring(0, startOffset) + change.text + this._content.substring(endOffset, this._content.length);
        const startLine = Math.max(range.start.line, 0);
        const endLine = Math.max(range.end.line, 0);
        let lineOffsets = this._lineOffsets;
        const addedLineOffsets = computeLineOffsets(change.text, false, startOffset);
        if (endLine - startLine === addedLineOffsets.length) {
          for (let i2 = 0, len = addedLineOffsets.length; i2 < len; i2++) {
            lineOffsets[i2 + startLine + 1] = addedLineOffsets[i2];
          }
        } else {
          if (addedLineOffsets.length < 1e4) {
            lineOffsets.splice(startLine + 1, endLine - startLine, ...addedLineOffsets);
          } else {
            this._lineOffsets = lineOffsets = lineOffsets.slice(0, startLine + 1).concat(addedLineOffsets, lineOffsets.slice(endLine + 1));
          }
        }
        const diff = change.text.length - (endOffset - startOffset);
        if (diff !== 0) {
          for (let i2 = startLine + 1 + addedLineOffsets.length, len = lineOffsets.length; i2 < len; i2++) {
            lineOffsets[i2] = lineOffsets[i2] + diff;
          }
        }
      } else if (_FullTextDocument.isFull(change)) {
        this._content = change.text;
        this._lineOffsets = void 0;
      } else {
        throw new Error("Unknown change event received");
      }
    }
    this._version = version;
  }
  getLineOffsets() {
    if (this._lineOffsets === void 0) {
      this._lineOffsets = computeLineOffsets(this._content, true);
    }
    return this._lineOffsets;
  }
  positionAt(offset) {
    offset = Math.max(Math.min(offset, this._content.length), 0);
    const lineOffsets = this.getLineOffsets();
    let low = 0, high = lineOffsets.length;
    if (high === 0) {
      return { line: 0, character: offset };
    }
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (lineOffsets[mid] > offset) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    const line2 = low - 1;
    offset = this.ensureBeforeEOL(offset, lineOffsets[line2]);
    return { line: line2, character: offset - lineOffsets[line2] };
  }
  offsetAt(position) {
    const lineOffsets = this.getLineOffsets();
    if (position.line >= lineOffsets.length) {
      return this._content.length;
    } else if (position.line < 0) {
      return 0;
    }
    const lineOffset = lineOffsets[position.line];
    if (position.character <= 0) {
      return lineOffset;
    }
    const nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
    const offset = Math.min(lineOffset + position.character, nextLineOffset);
    return this.ensureBeforeEOL(offset, lineOffset);
  }
  getLineRange(line2) {
    const lineOffsets = this.getLineOffsets();
    if (line2 >= lineOffsets.length) {
      const lastLine = lineOffsets.length - 1;
      return { start: { line: lastLine, character: 0 }, end: { line: lastLine, character: this._content.length - lineOffsets[lastLine] } };
    } else if (line2 < 0) {
      return { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    }
    const startOffset = lineOffsets[line2];
    const nextLineOffset = line2 + 1 < lineOffsets.length ? lineOffsets[line2 + 1] : this._content.length;
    const endOffset = this.ensureBeforeEOL(nextLineOffset, startOffset);
    return { start: { line: line2, character: 0 }, end: { line: line2, character: endOffset - startOffset } };
  }
  getEOLCharacters(line2) {
    const lineOffsets = this.getLineOffsets();
    if (line2 >= lineOffsets.length) {
      return "";
    } else if (line2 < 0) {
      return "";
    }
    const nextLineOffset = line2 + 1 < lineOffsets.length ? lineOffsets[line2 + 1] : this._content.length;
    const eolOffset = this.ensureBeforeEOL(nextLineOffset, lineOffsets[line2]);
    return this._content.substring(eolOffset, nextLineOffset);
  }
  ensureBeforeEOL(offset, lineOffset) {
    while (offset > lineOffset && isEOL(this._content.charCodeAt(offset - 1))) {
      offset--;
    }
    return offset;
  }
  get lineCount() {
    return this.getLineOffsets().length;
  }
  static isIncremental(event) {
    const candidate = event;
    return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range !== void 0 && (candidate.rangeLength === void 0 || typeof candidate.rangeLength === "number");
  }
  static isFull(event) {
    const candidate = event;
    return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range === void 0 && candidate.rangeLength === void 0;
  }
};
var TextDocument;
(function(TextDocument3) {
  function create(uri, languageId, version, content) {
    return new FullTextDocument(uri, languageId, version, content);
  }
  TextDocument3.create = create;
  function update(document, changes, version) {
    if (document instanceof FullTextDocument) {
      document.update(changes, version);
      return document;
    } else {
      throw new Error("TextDocument.update: document must be created by TextDocument.create");
    }
  }
  TextDocument3.update = update;
  function applyEdits(document, edits) {
    const text = document.getText();
    const sortedEdits = mergeSort(edits.map(getWellformedEdit), (a2, b2) => {
      const diff = a2.range.start.line - b2.range.start.line;
      if (diff === 0) {
        return a2.range.start.character - b2.range.start.character;
      }
      return diff;
    });
    let lastModifiedOffset = 0;
    const spans = [];
    for (const e2 of sortedEdits) {
      const startOffset = document.offsetAt(e2.range.start);
      if (startOffset < lastModifiedOffset) {
        throw new Error("Overlapping edit");
      } else if (startOffset > lastModifiedOffset) {
        spans.push(text.substring(lastModifiedOffset, startOffset));
      }
      if (e2.newText.length) {
        spans.push(e2.newText);
      }
      lastModifiedOffset = document.offsetAt(e2.range.end);
    }
    spans.push(text.substr(lastModifiedOffset));
    return spans.join("");
  }
  TextDocument3.applyEdits = applyEdits;
})(TextDocument || (TextDocument = {}));
function mergeSort(data, compare) {
  if (data.length <= 1) {
    return data;
  }
  const p2 = data.length / 2 | 0;
  const left = data.slice(0, p2);
  const right = data.slice(p2);
  mergeSort(left, compare);
  mergeSort(right, compare);
  let leftIdx = 0;
  let rightIdx = 0;
  let i2 = 0;
  while (leftIdx < left.length && rightIdx < right.length) {
    const ret = compare(left[leftIdx], right[rightIdx]);
    if (ret <= 0) {
      data[i2++] = left[leftIdx++];
    } else {
      data[i2++] = right[rightIdx++];
    }
  }
  while (leftIdx < left.length) {
    data[i2++] = left[leftIdx++];
  }
  while (rightIdx < right.length) {
    data[i2++] = right[rightIdx++];
  }
  return data;
}
function computeLineOffsets(text, isAtLineStart, textOffset = 0) {
  const result = isAtLineStart ? [textOffset] : [];
  for (let i2 = 0; i2 < text.length; i2++) {
    const ch = text.charCodeAt(i2);
    if (isEOL(ch)) {
      if (ch === 13 && i2 + 1 < text.length && text.charCodeAt(i2 + 1) === 10) {
        i2++;
      }
      result.push(textOffset + i2 + 1);
    }
  }
  return result;
}
function isEOL(char) {
  return char === 13 || char === 10;
}
function getWellformedRange(range) {
  const start = range.start;
  const end = range.end;
  if (start.line > end.line || start.line === end.line && start.character > end.character) {
    return { start: end, end: start };
  }
  return range;
}
function getWellformedEdit(textEdit) {
  const range = getWellformedRange(textEdit.range);
  if (range !== textEdit.range) {
    return { newText: textEdit.newText, range };
  }
  return textEdit;
}

// ../packages/language-server/src/lib/server.ts
var import_node21 = __toESM(require_main3(), 1);

// ../packages/language-core/src/lib/language-service/language-service.ts
var import_node_fs = require("fs");
var import_typescript = require("typescript");
var virtualFiles = /* @__PURE__ */ new Map();
var realFileVersions = /* @__PURE__ */ new Map();
var realFiles = /* @__PURE__ */ new Set();
var projectFileNames = [];
var languageService;
var currentCompilerOptions;
function getLanguageService(compilerOptions, fileNames = []) {
  const optionsChanged = currentCompilerOptions && JSON.stringify(currentCompilerOptions) !== JSON.stringify(compilerOptions);
  if (languageService && optionsChanged) {
    disposeLanguageService();
  }
  currentCompilerOptions = compilerOptions;
  projectFileNames = fileNames;
  languageService ??= (0, import_typescript.createLanguageService)(createHost(() => [.../* @__PURE__ */ new Set([...projectFileNames, ...realFiles])]), (0, import_typescript.createDocumentRegistry)());
  return languageService;
}
function createHost(getRootFileNames) {
  return {
    getScriptFileNames: () => [
      ...getRootFileNames(),
      ...virtualFiles.keys()
    ],
    getScriptVersion(fileName) {
      const virtual = virtualFiles.get(fileName);
      return virtual ? String(virtual.version) : getRealFileVersion(fileName);
    },
    getScriptSnapshot(fileName) {
      const virtual = virtualFiles.get(fileName);
      if (virtual) {
        return import_typescript.ScriptSnapshot.fromString(virtual.content);
      }
      if (!import_typescript.sys.fileExists(fileName)) {
        return void 0;
      }
      const text = import_typescript.sys.readFile(fileName);
      if (text === void 0) {
        return void 0;
      }
      return import_typescript.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => currentCompilerOptions ?? {},
    getDefaultLibFileName: (opts) => (0, import_typescript.getDefaultLibFilePath)(opts),
    fileExists(fileName) {
      return virtualFiles.has(fileName) || import_typescript.sys.fileExists(fileName);
    },
    readFile(fileName) {
      const virtual = virtualFiles.get(fileName);
      if (virtual) return virtual.content;
      return import_typescript.sys.readFile(fileName);
    },
    readDirectory: import_typescript.sys.readDirectory,
    directoryExists: import_typescript.sys.directoryExists,
    getDirectories: import_typescript.sys.getDirectories,
    realpath: import_typescript.sys.realpath
  };
}
function disposeLanguageService() {
  languageService.dispose();
  languageService = void 0;
  currentCompilerOptions = void 0;
  projectFileNames = [];
  virtualFiles.clear();
  realFileVersions.clear();
  realFiles.clear();
}
function getRealFileVersion(fileName) {
  try {
    const stat = (0, import_node_fs.statSync)(fileName);
    const v2 = String(stat.mtimeMs);
    realFileVersions.set(fileName, v2);
    return v2;
  } catch {
    return realFileVersions.get(fileName) ?? "0";
  }
}
function upsertVirtualFile(virtualPath, content) {
  const existing = virtualFiles.get(virtualPath);
  if (existing?.content !== content) {
    virtualFiles.set(virtualPath, {
      content,
      version: (existing?.version ?? 0) + 1
    });
  }
}

// ../packages/language-core/src/lib/utils/compiler-options/compiler-options.utils.ts
var import_node_path = require("path");
var import_typescript2 = require("typescript");
function loadTsConfig(fromDir) {
  const configPath = (0, import_typescript2.findConfigFile)(fromDir, import_typescript2.sys.fileExists, "tsconfig.json");
  if (!configPath) {
    return { options: {}, fileNames: [] };
  }
  const configFile = (0, import_typescript2.readConfigFile)(configPath, import_typescript2.sys.readFile);
  const parsed = (0, import_typescript2.parseJsonConfigFileContent)(configFile.config, import_typescript2.sys, (0, import_node_path.dirname)(configPath));
  return { options: parsed.options, fileNames: parsed.fileNames };
}

// ../packages/language-core/src/lib/utils/shim/shim.utils.ts
var import_node_path2 = require("path");
function createShim(componentData, typecheckBody) {
  const entries = Array.from(componentData.entries());
  const shimPath = `${entries[0][0]}.__typecheck__.ts`;
  const shim = buildTypecheckShim(entries, shimPath, typecheckBody.text);
  upsertVirtualFile(shimPath, shim.code);
  return shim;
}
function buildTypecheckShim(componentData, shimPath, body) {
  const prefixLinesLength = componentData.length + 4;
  const prefixLines = new Array(prefixLinesLength).fill("");
  const classNames = new Array();
  for (let i2 = 0; i2 < componentData.length; i2++) {
    const [path, classes] = componentData[i2];
    classNames.push(...classes);
    prefixLines[i2] = `import { ${classes.join(", ")} } from './${(0, import_node_path2.basename)(path, (0, import_node_path2.extname)(path))}';`;
  }
  prefixLines[prefixLinesLength - 4] = "import { Signal } from '@xaendar/core/signals'";
  prefixLines[prefixLinesLength - 2] = `declare const root: ${classNames.join(" & ")};`;
  return {
    code: [...prefixLines, body].join("\n"),
    bodyLineOffset: prefixLinesLength,
    path: shimPath,
    classNames
  };
}

// ../packages/language-server/src/lib/server-handlers.ts
var import_node_path5 = require("path");
var import_typescript9 = require("typescript");
var import_node20 = __toESM(require_main3(), 1);

// ../node_modules/vscode-uri/lib/esm/index.mjs
var t = { 975(t2) {
  function e2(t3) {
    if ("string" != typeof t3) throw new TypeError("Path must be a string. Received " + JSON.stringify(t3));
  }
  function r2(t3, e3) {
    for (var r3, n3 = "", i2 = 0, o2 = -1, h2 = 0, s2 = 0; s2 <= t3.length; ++s2) {
      if (s2 < t3.length) r3 = t3.charCodeAt(s2);
      else {
        if (47 === r3) break;
        r3 = 47;
      }
      if (47 === r3) {
        if (o2 === s2 - 1 || 1 === h2) ;
        else if (o2 !== s2 - 1 && 2 === h2) {
          if (n3.length < 2 || 2 !== i2 || 46 !== n3.charCodeAt(n3.length - 1) || 46 !== n3.charCodeAt(n3.length - 2)) {
            if (n3.length > 2) {
              var a2 = n3.lastIndexOf("/");
              if (a2 !== n3.length - 1) {
                -1 === a2 ? (n3 = "", i2 = 0) : i2 = (n3 = n3.slice(0, a2)).length - 1 - n3.lastIndexOf("/"), o2 = s2, h2 = 0;
                continue;
              }
            } else if (2 === n3.length || 1 === n3.length) {
              n3 = "", i2 = 0, o2 = s2, h2 = 0;
              continue;
            }
          }
          e3 && (n3.length > 0 ? n3 += "/.." : n3 = "..", i2 = 2);
        } else n3.length > 0 ? n3 += "/" + t3.slice(o2 + 1, s2) : n3 = t3.slice(o2 + 1, s2), i2 = s2 - o2 - 1;
        o2 = s2, h2 = 0;
      } else 46 === r3 && -1 !== h2 ? ++h2 : h2 = -1;
    }
    return n3;
  }
  var n2 = { resolve: function() {
    for (var t3, n3 = "", i2 = false, o2 = arguments.length - 1; o2 >= -1 && !i2; o2--) {
      var h2;
      o2 >= 0 ? h2 = arguments[o2] : (void 0 === t3 && (t3 = process.cwd()), h2 = t3), e2(h2), 0 !== h2.length && (n3 = h2 + "/" + n3, i2 = 47 === h2.charCodeAt(0));
    }
    return n3 = r2(n3, !i2), i2 ? n3.length > 0 ? "/" + n3 : "/" : n3.length > 0 ? n3 : ".";
  }, normalize: function(t3) {
    if (e2(t3), 0 === t3.length) return ".";
    var n3 = 47 === t3.charCodeAt(0), i2 = 47 === t3.charCodeAt(t3.length - 1);
    return 0 !== (t3 = r2(t3, !n3)).length || n3 || (t3 = "."), t3.length > 0 && i2 && (t3 += "/"), n3 ? "/" + t3 : t3;
  }, isAbsolute: function(t3) {
    return e2(t3), t3.length > 0 && 47 === t3.charCodeAt(0);
  }, join: function() {
    if (0 === arguments.length) return ".";
    for (var t3, r3 = 0; r3 < arguments.length; ++r3) {
      var i2 = arguments[r3];
      e2(i2), i2.length > 0 && (void 0 === t3 ? t3 = i2 : t3 += "/" + i2);
    }
    return void 0 === t3 ? "." : n2.normalize(t3);
  }, relative: function(t3, r3) {
    if (e2(t3), e2(r3), t3 === r3) return "";
    if ((t3 = n2.resolve(t3)) === (r3 = n2.resolve(r3))) return "";
    for (var i2 = 1; i2 < t3.length && 47 === t3.charCodeAt(i2); ++i2) ;
    for (var o2 = t3.length, h2 = o2 - i2, s2 = 1; s2 < r3.length && 47 === r3.charCodeAt(s2); ++s2) ;
    for (var a2 = r3.length - s2, c2 = h2 < a2 ? h2 : a2, f2 = -1, u2 = 0; u2 <= c2; ++u2) {
      if (u2 === c2) {
        if (a2 > c2) {
          if (47 === r3.charCodeAt(s2 + u2)) return r3.slice(s2 + u2 + 1);
          if (0 === u2) return r3.slice(s2 + u2);
        } else h2 > c2 && (47 === t3.charCodeAt(i2 + u2) ? f2 = u2 : 0 === u2 && (f2 = 0));
        break;
      }
      var l2 = t3.charCodeAt(i2 + u2);
      if (l2 !== r3.charCodeAt(s2 + u2)) break;
      47 === l2 && (f2 = u2);
    }
    var g2 = "";
    for (u2 = i2 + f2 + 1; u2 <= o2; ++u2) u2 !== o2 && 47 !== t3.charCodeAt(u2) || (0 === g2.length ? g2 += ".." : g2 += "/..");
    return g2.length > 0 ? g2 + r3.slice(s2 + f2) : (s2 += f2, 47 === r3.charCodeAt(s2) && ++s2, r3.slice(s2));
  }, _makeLong: function(t3) {
    return t3;
  }, dirname: function(t3) {
    if (e2(t3), 0 === t3.length) return ".";
    for (var r3 = t3.charCodeAt(0), n3 = 47 === r3, i2 = -1, o2 = true, h2 = t3.length - 1; h2 >= 1; --h2) if (47 === (r3 = t3.charCodeAt(h2))) {
      if (!o2) {
        i2 = h2;
        break;
      }
    } else o2 = false;
    return -1 === i2 ? n3 ? "/" : "." : n3 && 1 === i2 ? "//" : t3.slice(0, i2);
  }, basename: function(t3, r3) {
    if (void 0 !== r3 && "string" != typeof r3) throw new TypeError('"ext" argument must be a string');
    e2(t3);
    var n3, i2 = 0, o2 = -1, h2 = true;
    if (void 0 !== r3 && r3.length > 0 && r3.length <= t3.length) {
      if (r3.length === t3.length && r3 === t3) return "";
      var s2 = r3.length - 1, a2 = -1;
      for (n3 = t3.length - 1; n3 >= 0; --n3) {
        var c2 = t3.charCodeAt(n3);
        if (47 === c2) {
          if (!h2) {
            i2 = n3 + 1;
            break;
          }
        } else -1 === a2 && (h2 = false, a2 = n3 + 1), s2 >= 0 && (c2 === r3.charCodeAt(s2) ? -1 === --s2 && (o2 = n3) : (s2 = -1, o2 = a2));
      }
      return i2 === o2 ? o2 = a2 : -1 === o2 && (o2 = t3.length), t3.slice(i2, o2);
    }
    for (n3 = t3.length - 1; n3 >= 0; --n3) if (47 === t3.charCodeAt(n3)) {
      if (!h2) {
        i2 = n3 + 1;
        break;
      }
    } else -1 === o2 && (h2 = false, o2 = n3 + 1);
    return -1 === o2 ? "" : t3.slice(i2, o2);
  }, extname: function(t3) {
    e2(t3);
    for (var r3 = -1, n3 = 0, i2 = -1, o2 = true, h2 = 0, s2 = t3.length - 1; s2 >= 0; --s2) {
      var a2 = t3.charCodeAt(s2);
      if (47 !== a2) -1 === i2 && (o2 = false, i2 = s2 + 1), 46 === a2 ? -1 === r3 ? r3 = s2 : 1 !== h2 && (h2 = 1) : -1 !== r3 && (h2 = -1);
      else if (!o2) {
        n3 = s2 + 1;
        break;
      }
    }
    return -1 === r3 || -1 === i2 || 0 === h2 || 1 === h2 && r3 === i2 - 1 && r3 === n3 + 1 ? "" : t3.slice(r3, i2);
  }, format: function(t3) {
    if (null === t3 || "object" != typeof t3) throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof t3);
    return (function(t4, e3) {
      var r3 = e3.dir || e3.root, n3 = e3.base || (e3.name || "") + (e3.ext || "");
      return r3 ? r3 === e3.root ? r3 + n3 : r3 + "/" + n3 : n3;
    })(0, t3);
  }, parse: function(t3) {
    e2(t3);
    var r3 = { root: "", dir: "", base: "", ext: "", name: "" };
    if (0 === t3.length) return r3;
    var n3, i2 = t3.charCodeAt(0), o2 = 47 === i2;
    o2 ? (r3.root = "/", n3 = 1) : n3 = 0;
    for (var h2 = -1, s2 = 0, a2 = -1, c2 = true, f2 = t3.length - 1, u2 = 0; f2 >= n3; --f2) if (47 !== (i2 = t3.charCodeAt(f2))) -1 === a2 && (c2 = false, a2 = f2 + 1), 46 === i2 ? -1 === h2 ? h2 = f2 : 1 !== u2 && (u2 = 1) : -1 !== h2 && (u2 = -1);
    else if (!c2) {
      s2 = f2 + 1;
      break;
    }
    return -1 === h2 || -1 === a2 || 0 === u2 || 1 === u2 && h2 === a2 - 1 && h2 === s2 + 1 ? -1 !== a2 && (r3.base = r3.name = 0 === s2 && o2 ? t3.slice(1, a2) : t3.slice(s2, a2)) : (0 === s2 && o2 ? (r3.name = t3.slice(1, h2), r3.base = t3.slice(1, a2)) : (r3.name = t3.slice(s2, h2), r3.base = t3.slice(s2, a2)), r3.ext = t3.slice(h2, a2)), s2 > 0 ? r3.dir = t3.slice(0, s2 - 1) : o2 && (r3.dir = "/"), r3;
  }, sep: "/", delimiter: ":", win32: null, posix: null };
  n2.posix = n2, t2.exports = n2;
} };
var e = {};
function r(n2) {
  var i2 = e[n2];
  if (void 0 !== i2) return i2.exports;
  var o2 = e[n2] = { exports: {} };
  return t[n2](o2, o2.exports, r), o2.exports;
}
var n;
if (r.d = (t2, e2) => {
  for (var n2 in e2) r.o(e2, n2) && !r.o(t2, n2) && Object.defineProperty(t2, n2, { enumerable: true, get: e2[n2] });
}, r.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2), "object" == typeof process) n = "win32" === process.platform;
else if ("object" == typeof navigator) {
  let t2 = navigator.userAgent;
  n = t2.indexOf("Windows") >= 0;
}
var i = /^\w[\w\d+.-]*$/;
var o = /^\//;
var h = /^\/\//;
function s(t2, e2) {
  if (!t2.scheme && e2) throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${t2.authority}", path: "${t2.path}", query: "${t2.query}", fragment: "${t2.fragment}"}`);
  if (t2.scheme && !i.test(t2.scheme)) throw new Error("[UriError]: Scheme contains illegal characters.");
  if (t2.path) {
    if (t2.authority) {
      if (!o.test(t2.path)) throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
    } else if (h.test(t2.path)) throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
  }
}
var a = "";
var c = "/";
var f = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
var u = class _u {
  static isUri(t2) {
    return t2 instanceof _u || !!t2 && "string" == typeof t2.authority && "string" == typeof t2.fragment && "string" == typeof t2.path && "string" == typeof t2.query && "string" == typeof t2.scheme && "string" == typeof t2.fsPath && "function" == typeof t2.with && "function" == typeof t2.toString;
  }
  scheme;
  authority;
  path;
  query;
  fragment;
  constructor(t2, e2, r2, n2, i2, o2 = false) {
    "object" == typeof t2 ? (this.scheme = t2.scheme || a, this.authority = t2.authority || a, this.path = t2.path || a, this.query = t2.query || a, this.fragment = t2.fragment || a) : (this.scheme = /* @__PURE__ */ (function(t3, e3) {
      return t3 || e3 ? t3 : "file";
    })(t2, o2), this.authority = e2 || a, this.path = (function(t3, e3) {
      switch (t3) {
        case "https":
        case "http":
        case "file":
          e3 ? e3[0] !== c && (e3 = c + e3) : e3 = c;
      }
      return e3;
    })(this.scheme, r2 || a), this.query = n2 || a, this.fragment = i2 || a, s(this, o2));
  }
  get fsPath() {
    return y(this, false);
  }
  with(t2) {
    if (!t2) return this;
    let { scheme: e2, authority: r2, path: n2, query: i2, fragment: o2 } = t2;
    return void 0 === e2 ? e2 = this.scheme : null === e2 && (e2 = a), void 0 === r2 ? r2 = this.authority : null === r2 && (r2 = a), void 0 === n2 ? n2 = this.path : null === n2 && (n2 = a), void 0 === i2 ? i2 = this.query : null === i2 && (i2 = a), void 0 === o2 ? o2 = this.fragment : null === o2 && (o2 = a), e2 === this.scheme && r2 === this.authority && n2 === this.path && i2 === this.query && o2 === this.fragment ? this : new g(e2, r2, n2, i2, o2);
  }
  static parse(t2, e2 = false) {
    const r2 = f.exec(t2);
    return r2 ? new g(r2[2] || a, A(r2[4] || a), A(r2[5] || a), A(r2[7] || a), A(r2[9] || a), e2) : new g(a, a, a, a, a);
  }
  static file(t2) {
    let e2 = a;
    if (n && (t2 = t2.replace(/\\/g, c)), t2[0] === c && t2[1] === c) {
      const r2 = t2.indexOf(c, 2);
      -1 === r2 ? (e2 = t2.substring(2), t2 = c) : (e2 = t2.substring(2, r2), t2 = t2.substring(r2) || c);
    }
    return new g("file", e2, t2, a, a);
  }
  static from(t2) {
    const e2 = new g(t2.scheme, t2.authority, t2.path, t2.query, t2.fragment);
    return s(e2, true), e2;
  }
  toString(t2 = false) {
    return v(this, t2);
  }
  toJSON() {
    return this;
  }
  static revive(t2) {
    if (t2) {
      if (t2 instanceof _u) return t2;
      {
        const e2 = new g(t2);
        return e2._formatted = t2.external, e2._fsPath = t2._sep === l ? t2.fsPath : null, e2;
      }
    }
    return t2;
  }
};
var l = n ? 1 : void 0;
var g = class extends u {
  _formatted = null;
  _fsPath = null;
  get fsPath() {
    return this._fsPath || (this._fsPath = y(this, false)), this._fsPath;
  }
  toString(t2 = false) {
    return t2 ? v(this, true) : (this._formatted || (this._formatted = v(this, false)), this._formatted);
  }
  toJSON() {
    const t2 = { $mid: 1 };
    return this._fsPath && (t2.fsPath = this._fsPath, t2._sep = l), this._formatted && (t2.external = this._formatted), this.path && (t2.path = this.path), this.scheme && (t2.scheme = this.scheme), this.authority && (t2.authority = this.authority), this.query && (t2.query = this.query), this.fragment && (t2.fragment = this.fragment), t2;
  }
};
var p = { 58: "%3A", 47: "%2F", 63: "%3F", 35: "%23", 91: "%5B", 93: "%5D", 64: "%40", 33: "%21", 36: "%24", 38: "%26", 39: "%27", 40: "%28", 41: "%29", 42: "%2A", 43: "%2B", 44: "%2C", 59: "%3B", 61: "%3D", 32: "%20" };
function d(t2, e2, r2) {
  let n2, i2 = -1;
  for (let o2 = 0; o2 < t2.length; o2++) {
    const h2 = t2.charCodeAt(o2);
    if (h2 >= 97 && h2 <= 122 || h2 >= 65 && h2 <= 90 || h2 >= 48 && h2 <= 57 || 45 === h2 || 46 === h2 || 95 === h2 || 126 === h2 || e2 && 47 === h2 || r2 && 91 === h2 || r2 && 93 === h2 || r2 && 58 === h2) -1 !== i2 && (n2 += encodeURIComponent(t2.substring(i2, o2)), i2 = -1), void 0 !== n2 && (n2 += t2.charAt(o2));
    else {
      void 0 === n2 && (n2 = t2.substr(0, o2));
      const e3 = p[h2];
      void 0 !== e3 ? (-1 !== i2 && (n2 += encodeURIComponent(t2.substring(i2, o2)), i2 = -1), n2 += e3) : -1 === i2 && (i2 = o2);
    }
  }
  return -1 !== i2 && (n2 += encodeURIComponent(t2.substring(i2))), void 0 !== n2 ? n2 : t2;
}
function m(t2) {
  let e2;
  for (let r2 = 0; r2 < t2.length; r2++) {
    const n2 = t2.charCodeAt(r2);
    35 === n2 || 63 === n2 ? (void 0 === e2 && (e2 = t2.substr(0, r2)), e2 += p[n2]) : void 0 !== e2 && (e2 += t2[r2]);
  }
  return void 0 !== e2 ? e2 : t2;
}
function y(t2, e2) {
  let r2;
  return r2 = t2.authority && t2.path.length > 1 && "file" === t2.scheme ? `//${t2.authority}${t2.path}` : 47 === t2.path.charCodeAt(0) && (t2.path.charCodeAt(1) >= 65 && t2.path.charCodeAt(1) <= 90 || t2.path.charCodeAt(1) >= 97 && t2.path.charCodeAt(1) <= 122) && 58 === t2.path.charCodeAt(2) ? e2 ? t2.path.substr(1) : t2.path[1].toLowerCase() + t2.path.substr(2) : t2.path, n && (r2 = r2.replace(/\//g, "\\")), r2;
}
function v(t2, e2) {
  const r2 = e2 ? m : d;
  let n2 = "", { scheme: i2, authority: o2, path: h2, query: s2, fragment: a2 } = t2;
  if (i2 && (n2 += i2, n2 += ":"), (o2 || "file" === i2) && (n2 += c, n2 += c), o2) {
    let t3 = o2.indexOf("@");
    if (-1 !== t3) {
      const e3 = o2.substr(0, t3);
      o2 = o2.substr(t3 + 1), t3 = e3.lastIndexOf(":"), -1 === t3 ? n2 += r2(e3, false, false) : (n2 += r2(e3.substr(0, t3), false, false), n2 += ":", n2 += r2(e3.substr(t3 + 1), false, true)), n2 += "@";
    }
    o2 = o2.toLowerCase(), t3 = o2.lastIndexOf(":"), -1 === t3 ? n2 += r2(o2, false, true) : (n2 += r2(o2.substr(0, t3), false, true), n2 += o2.substr(t3));
  }
  if (h2) {
    if (h2.length >= 3 && 47 === h2.charCodeAt(0) && 58 === h2.charCodeAt(2)) {
      const t3 = h2.charCodeAt(1);
      t3 >= 65 && t3 <= 90 && (h2 = `/${String.fromCharCode(t3 + 32)}:${h2.substr(3)}`);
    } else if (h2.length >= 2 && 58 === h2.charCodeAt(1)) {
      const t3 = h2.charCodeAt(0);
      t3 >= 65 && t3 <= 90 && (h2 = `${String.fromCharCode(t3 + 32)}:${h2.substr(2)}`);
    }
    n2 += r2(h2, true, false);
  }
  return s2 && (n2 += "?", n2 += r2(s2, false, false)), a2 && (n2 += "#", n2 += e2 ? a2 : d(a2, false, false)), n2;
}
function b(t2) {
  try {
    return decodeURIComponent(t2);
  } catch {
    return t2.length > 3 ? t2.substr(0, 3) + b(t2.substr(3)) : t2;
  }
}
var C = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
function A(t2) {
  return t2.match(C) ? t2.replace(C, (t3) => b(t3)) : t2;
}
var w = r(975);
var x = w.posix || w;
var P = "/";
var _;
!(function(t2) {
  t2.joinPath = function(t3, ...e2) {
    return t3.with({ path: x.join(t3.path, ...e2) });
  }, t2.resolvePath = function(t3, ...e2) {
    let r2 = t3.path, n2 = false;
    r2[0] !== P && (r2 = P + r2, n2 = true);
    let i2 = x.resolve(r2, ...e2);
    return n2 && i2[0] === P && !t3.authority && (i2 = i2.substring(1)), t3.with({ path: i2 });
  }, t2.dirname = function(t3) {
    if (0 === t3.path.length || t3.path === P) return t3;
    let e2 = x.dirname(t3.path);
    return 1 === e2.length && 46 === e2.charCodeAt(0) && (e2 = ""), t3.with({ path: e2 });
  }, t2.basename = function(t3) {
    return x.basename(t3.path);
  }, t2.extname = function(t3) {
    return x.extname(t3.path);
  };
})(_ || (_ = {}));

// ../packages/common/src/models/stack/stack.ts
var Stack = class {
  /**
   * Internal array holding the stack elements, ordered from bottom to top.
   */
  _elements = new Array();
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        return isNaN(Number(prop)) ? target[prop] : target._elements[Number(prop)];
      }
    });
  }
  /**
   * The number of elements currently in the stack.
   */
  get length() {
    return this._elements.length;
  }
  /**
   * A shallow copy of the elements in the stack, ordered from bottom to top.
   */
  get values() {
    return [...this._elements];
  }
  /**
   * Removes and returns the top element of the stack.
   *
   * @returns The top element, or `undefined` if the stack is empty.
   */
  pop() {
    return this._elements.pop();
  }
  /**
   * Pushes an element onto the top of the stack.
   *
   * @param element - The element to push.
   * @returns The new length of the stack.
   */
  push(element) {
    return this._elements.push(element);
  }
};

// ../packages/common/src/utils/array/array.util.ts
Object.defineProperty(Array.prototype, "removeItem", {
  value: function(item) {
    const index = this.indexOf(item);
    if (index === -1) {
      return false;
    }
    this.splice(index, 1);
    return true;
  },
  enumerable: false,
  configurable: false,
  writable: false
});

// ../packages/common/src/utils/indent/indent.util.ts
function indent(lines) {
  return typeof lines === "string" ? `  ${lines}` : lines.map((line2) => `  ${line2}`);
}

// ../packages/common/src/utils/string/string.util.ts
function slice(value, start, end) {
  return JSON.parse(JSON.stringify(value.slice(start, end)));
}

// ../packages/common/src/costants/not-alllowed-tags.constants.ts
var NOT_ALLOWED_TAGS = [
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph"
];

// ../packages/common/src/utils/tags/tags.util.ts
function isValidCustomElementName(tagName, logErrors = true) {
  if (!/^[a-z][a-z0-9._\-]*-[a-z0-9._\-]*$/.test(tagName)) {
    logErrors && console.error(`Tag <${tagName}> is not a valid custom element name. Custom element names must:
- contain a hyphen
- no spaces.
- start with a lowercase letter.
- not contain uppercase letters.
- not be a native HTML tag name.
- not contain the following chars: '@', '#', '$', '%', '&', '*', '!', '?', '/', '\\', '|', "'", '"', '<', '>', '='
`);
    return false;
  }
  if (isReservedTagName(tagName)) {
    logErrors && console.error(`Tag <${tagName}> is a reserved tag name and cannot be used as a custom element name.
Reserved names are: 
- ${NOT_ALLOWED_TAGS.join("\n- ")}`);
    return false;
  }
  return true;
}
function isReservedTagName(tagName) {
  return NOT_ALLOWED_TAGS.includes(tagName);
}

// ../packages/compiler/src/parser/types/node.enum.ts
var ASTNodeType = /* @__PURE__ */ ((ASTNodeType2) => {
  ASTNodeType2[ASTNodeType2["Element"] = 0] = "Element";
  ASTNodeType2[ASTNodeType2["Attribute"] = 1] = "Attribute";
  ASTNodeType2[ASTNodeType2["Event"] = 2] = "Event";
  ASTNodeType2[ASTNodeType2["Text"] = 3] = "Text";
  ASTNodeType2[ASTNodeType2["Interpolation"] = 4] = "Interpolation";
  ASTNodeType2[ASTNodeType2["If"] = 5] = "If";
  ASTNodeType2[ASTNodeType2["Else"] = 6] = "Else";
  ASTNodeType2[ASTNodeType2["ElseIf"] = 7] = "ElseIf";
  ASTNodeType2[ASTNodeType2["For"] = 8] = "For";
  ASTNodeType2[ASTNodeType2["Switch"] = 9] = "Switch";
  ASTNodeType2[ASTNodeType2["Case"] = 10] = "Case";
  ASTNodeType2[ASTNodeType2["Import"] = 11] = "Import";
  ASTNodeType2[ASTNodeType2["IfBinding"] = 12] = "IfBinding";
  ASTNodeType2[ASTNodeType2["SwitchBinding"] = 13] = "SwitchBinding";
  ASTNodeType2[ASTNodeType2["ConditionalBindingBranch"] = 14] = "ConditionalBindingBranch";
  ASTNodeType2[ASTNodeType2["Directive"] = 15] = "Directive";
  ASTNodeType2[ASTNodeType2["StructuralDirective"] = 16] = "StructuralDirective";
  return ASTNodeType2;
})(ASTNodeType || {});

// ../packages/compiler/src/utils/catch-error-generation/catch-error-generation.utils.ts
function catchErrorWithPrefix(prefix, input, err) {
  if (err instanceof Error) {
    const { message, cause, stack } = err;
    const isSpan = (cause2) => !!cause2 && typeof cause2 === "object" && "start" in cause2 && "end" in cause2;
    if (isSpan(cause)) {
      throw `[${prefix}] ${message}
----> ${slice(input, cause.start, cause.end)}`;
    }
    const error = new Error(`[${prefix}] ${message}`);
    error.stack = stack;
    throw error;
  } else {
    throw new Error(`[${prefix}] ${err}`);
  }
}

// ../packages/compiler/src/generator/models/compiler-context/compiler-context.model.ts
var CompilerContext = class {
  /**
   * The compiler cache associated with this context, used to store and retrieve
   * intermediate compilation results for efficiency.
   */
  cache;
  /**
   * Parent context representing the enclosing scope.
   */
  parent;
  /**
   * A set containting all the signals declared in the class (and subclasses)
   * associated to the template
   */
  _componentSignalsFields = /* @__PURE__ */ new Set();
  /**
   * Identifiers declared directly in this scope, mapped to whether they
   * hold a plain value or a signal (e.g. `@for` implicit variables like
   * `$index` are signals; the loop item itself is a plain value).
   */
  _identifiers = /* @__PURE__ */ new Map();
  /**
   * List of identifiers that should not be resolved
   * and touched in anyway
   * (e.g. $event)
   */
  _unresolvableIdentifiers = /* @__PURE__ */ new Map();
  /**
   * Creates a new scope context.
   *
   * @param parent - Optional parent context representing the enclosing scope.
   */
  constructor(parent) {
    if (parent) {
      this.parent = parent;
      this.cache = parent.cache;
    }
  }
  /**
   * Registers a new identifier name in this scope.
   *
   * @param name - The identifier name to register.
   * @param kind - Whether the identifier holds a plain value or a signal.
   *   Defaults to `'value'`.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  addIdentifier(name, kind = "value") {
    if (this._identifiers.has(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }
    this._identifiers.set(name, kind);
  }
  /**
   * Registers a new unresolvable identifier name in this scope.
   * Unresolvable identifiers (e.g. `$event`) are tracked so lookups via
   * {@link hasIdentifier} recognize them, but they are never meant to be
   * resolved or otherwise manipulated by the compiler.
   *
   * @param name - The identifier name to register.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  addUnresolvableIdentifier(name, kind = "value") {
    if (this._unresolvableIdentifiers.has(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }
    this._unresolvableIdentifiers.set(name, kind);
  }
  /**
   * Registers a new signal field name in this scope.
   *
   * @param name - The identifier name to register.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  addSignalClassField(name) {
    if (this._componentSignalsFields.has(name)) {
      throw new Error(`Signal field "${name}" is already declared in this scope.`);
    }
    this._componentSignalsFields.add(name);
  }
  /**
   * Removes a previously registered identifier from this scope, if present.
   * Does nothing if no identifier with the given name is declared in this scope.
   * Note: this only affects the current scope, not any ancestor scopes.
   *
   * @param name - The identifier name to remove.
   */
  removeIdentifier(name) {
    this._identifiers.delete(name);
  }
  /**
   * Removes a previously registered unresolvable identifier from this scope, if present.
   * Does nothing if no unresolvable identifier with the given name is declared in this scope.
   * Note: this only affects the current scope, not any ancestor scopes.
   *
   * @param name - The identifier name to remove. 
   */
  removeUnresolvabledIdentifier(name) {
    this._unresolvableIdentifiers.delete(name);
  }
  /**
   * Returns `true` if an identifier with the given name is declared in this
   * scope or any of its ancestor scopes.
   *
   * @param name - The identifier name to look up.
   * @returns `true` if the identifier exists in the scope chain, `false` otherwise.
   */
  hasIdentifier(name) {
    return this._identifiers.has(name) || (this.parent?.hasIdentifier(name) ?? false);
  }
  /**
   * Returns `true` if an identifier with the given name is declared in this
   * scope or any of its ancestor scopes.
  *
  * @param name - The identifier name to look up.
  * @returns `true` if the identifier exists in the scope chain, `false` otherwise.
  */
  hasUnresolvableIdentifier(name) {
    return this._unresolvableIdentifiers.has(name) || (this.parent?.hasUnresolvableIdentifier(name) ?? false);
  }
  /**
   * Returns `true` if a signal field with the given name is declared in this
   * scope or any of its ancestor scopes.
   *
   * @param name - The signal field name to look up.
   * @returns `true` if the ignal field exists in the scope chain, `false` otherwise.
   */
  hasSignalField(name) {
    return this._componentSignalsFields.has(name) || (this.parent?.hasSignalField(name) ?? false);
  }
  /**
   * Resolves the kind (`'value'` or `'signal'`) of a declared identifier,
   * walking up the scope chain if not found in this scope.
   *
   * @param name - The identifier name to look up.
   * @returns The identifier's kind, or `undefined` if it isn't declared
   *   anywhere in the scope chain.
   */
  getIdentifierKind(name) {
    return this._identifiers.get(name) ?? this.parent?.getIdentifierKind(name);
  }
  /**
   * Resolves the kind (`'value'` or `'signal'`) of a unresolvable declared identifier,
   * walking up the scope chain if not found in this scope.
   *
   * @param name - The unresolvable identifier name to look up.
   * @returns The unresolvable identifier's kind, or `undefined` if it isn't declared
   *   anywhere in the scope chain.
   */
  getUnresolvableIdentifierKind(name) {
    return this._unresolvableIdentifiers.get(name) ?? this.parent?.getUnresolvableIdentifierKind(name);
  }
};

// ../packages/compiler/src/generator/utils/generator/generator.utils.ts
var import_typescript3 = require("typescript");
var GLOBAL_IDENTIFIERS = /* @__PURE__ */ new Set([
  // ---- Value properties ------------------------------------------------
  // true, false, null are SyntaxKind keywords — not needed here.
  "undefined",
  "NaN",
  "Infinity",
  "globalThis",
  // ---- Global functions ------------------------------------------------
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  // Deprecated but still Identifiers in TS
  "escape",
  "unescape",
  // ---- Fundamental objects ---------------------------------------------
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  // ---- Error objects ---------------------------------------------------
  "Error",
  "AggregateError",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "SuppressedError",
  // ES2026 — explicit resource management
  "InternalError",
  // Non-standard (Firefox) but common
  // ---- Numbers and dates -----------------------------------------------
  "Number",
  "BigInt",
  "Math",
  "Date",
  "Temporal",
  // ES2026 — replaces Date
  // ---- Text processing -------------------------------------------------
  "String",
  "RegExp",
  // ---- Indexed collections ---------------------------------------------
  "Array",
  "TypedArray",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "BigInt64Array",
  "BigUint64Array",
  "Float16Array",
  // ES2025
  "Float32Array",
  "Float64Array",
  // ---- Keyed collections -----------------------------------------------
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  // ---- Structured data -------------------------------------------------
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Atomics",
  "JSON",
  // ---- Memory management -----------------------------------------------
  "WeakRef",
  "FinalizationRegistry",
  // ---- Control abstractions --------------------------------------------
  "Iterator",
  // ES2025
  "AsyncIterator",
  // ES2025
  "Promise",
  "GeneratorFunction",
  "AsyncGeneratorFunction",
  "Generator",
  "AsyncGenerator",
  "AsyncFunction",
  "DisposableStack",
  // ES2026 — explicit resource management
  "AsyncDisposableStack",
  // ES2026 — explicit resource management
  // ---- Reflection ------------------------------------------------------
  "Reflect",
  "Proxy",
  // ---- Internationalization --------------------------------------------
  "Intl",
  // ---- WebAssembly -----------------------------------------------------
  "WebAssembly",
  // ---- Browser / DOM globals -------------------------------------------
  // These are not part of the ECMAScript spec but are universally available
  // in browser environments and must not be treated as component properties.
  "window",
  "document",
  "navigator",
  "location",
  "history",
  "screen",
  "console",
  "performance",
  "crypto",
  "fetch",
  "alert",
  "confirm",
  "prompt",
  "setTimeout",
  "setInterval",
  "clearTimeout",
  "clearInterval",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "queueMicrotask",
  "structuredClone",
  "URL",
  "URLSearchParams",
  "FormData",
  "Headers",
  "Request",
  "Response",
  "AbortController",
  "AbortSignal",
  "CustomEvent",
  "Event",
  "EventTarget",
  "MutationObserver",
  "IntersectionObserver",
  "ResizeObserver",
  "PerformanceObserver",
  "Worker",
  "SharedWorker",
  "ServiceWorker",
  "Blob",
  "File",
  "FileReader",
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "TextEncoder",
  "TextDecoder",
  "ImageData",
  "Canvas",
  "Storage",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "WebSocket",
  "XMLHttpRequest",
  // ---- DOM element constructors ----------------------------------------
  // Commonly used with instanceof in template expressions.
  "HTMLElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLFormElement",
  "HTMLAnchorElement",
  "HTMLImageElement",
  "HTMLVideoElement",
  "HTMLAudioElement",
  "HTMLCanvasElement",
  "HTMLSelectElement",
  "HTMLTextAreaElement",
  "HTMLDivElement",
  "HTMLSpanElement",
  "HTMLParagraphElement",
  "HTMLHeadingElement",
  "HTMLTableElement",
  "HTMLTableRowElement",
  "HTMLTableCellElement",
  "HTMLUListElement",
  "HTMLOListElement",
  "HTMLLIElement",
  "HTMLLabelElement",
  "HTMLDialogElement",
  "HTMLDetailsElement",
  "HTMLSlotElement",
  "HTMLTemplateElement",
  "SVGElement",
  "SVGSVGElement",
  "Element",
  "Node",
  "NodeList",
  "DocumentFragment",
  "ShadowRoot",
  "Document",
  "Window"
]);
var ROOT_NODE = "root";
function resolveExpression(expression, compilerContext, options) {
  return emitNode(expression, expression, compilerContext, mapDefaultOptions(options));
}
function emitNode(node, parent, compilerContext, options) {
  if ((0, import_typescript3.isIdentifier)(node) && needsResolution(node, parent)) {
    const text = node.text;
    if (options.skipResolution) {
      return { expression: text };
    }
    if (compilerContext.hasSignalField(text)) {
      return { expression: `this.${text}`, reactive: true };
    }
    if (compilerContext.hasUnresolvableIdentifier(text)) {
      return { expression: text, reactive: compilerContext.getUnresolvableIdentifierKind(text) === "signal" };
    }
    if (compilerContext.hasIdentifier(text)) {
      const kind = compilerContext.getIdentifierKind(text);
      return { expression: `context.get('${text}')`, reactive: kind === "signal" };
    }
    if (options.resolver) {
      return { expression: `${options.resolver}.${text}` };
    }
    return { expression: text };
  }
  if (!containsResolvableIdentifier(node, parent)) {
    return { expression: node.getText() };
  }
  const sourceText = node.getSourceFile().text;
  let result = { expression: "" };
  let lastEnd = node.getStart();
  (0, import_typescript3.forEachChild)(node, (child) => {
    const { expression, reactive } = emitNode(child, node, compilerContext, options);
    result = { expression: `${result.expression}${slice(sourceText, lastEnd, child.getStart())}${expression}`, reactive: result.reactive || reactive };
    lastEnd = child.getEnd();
  });
  return { expression: `${result.expression}${slice(sourceText, lastEnd, node.getEnd())}`, reactive: result.reactive };
}
function containsResolvableIdentifier(node, parent) {
  if ((0, import_typescript3.isIdentifier)(node) && needsResolution(node, parent)) {
    return true;
  }
  let found = false;
  (0, import_typescript3.forEachChild)(node, (child) => {
    if (!found) {
      found = containsResolvableIdentifier(child, node);
    }
  });
  return found;
}
function needsResolution(node, parent) {
  return !((0, import_typescript3.isPropertyAccessExpression)(parent) && parent.name === node || (0, import_typescript3.isPropertyAssignment)(parent) && parent.name === node || GLOBAL_IDENTIFIERS.has(node.text) || !node.text);
}
function getElementIdentifier(node, parentNode, index) {
  return getIdentifier(node.tagName, parentNode, index);
}
function getTextIdentifier(prefix = "text", parentNode, index) {
  return getIdentifier(prefix, parentNode, index);
}
function getBlockIdentifier(prefix, parentNode, index) {
  return getIdentifier(prefix, parentNode, index);
}
function toStringLiteral(value) {
  const STRING_LITERAL_ESCAPES = {
    "\\": "\\\\",
    "'": "\\'",
    "\n": "\\n",
    "\r": "\\r"
  };
  return `'${value.replace(/[\\'\n\r\p{Zl}\p{Zp}]/gu, (char) => STRING_LITERAL_ESCAPES[char] ?? `\\u${char.charCodeAt(0).toString(16)}`)}'`;
}
function getIdentifier(prefix, parentNode, index) {
  const identifier = parentNode !== ROOT_NODE ? `${parentNode}__${prefix}${index}` : `${prefix}${index}`;
  return identifier.replace(/-/g, "_");
}
function mapDefaultOptions(options) {
  return {
    resolver: options?.resolver ?? "this",
    skipResolution: options?.skipResolution ?? false
  };
}

// ../packages/compiler/src/generator/states/generate-element/generate-element.state.ts
async function generateElement(node, parentNode, index, compilerContext, anchor) {
  const tagName = node.tagName;
  const isCustomElement = isValidCustomElementName(tagName, false);
  const attributes = await mapAttributes(node.attributes, compilerContext, tagName);
  const events = mapEvents(node.events, compilerContext);
  const conditionalBindings = await mapConditionalBindings(node.conditionalBindings, compilerContext, tagName, isCustomElement);
  const directives = await mapDirectives(node.directives, compilerContext);
  const structuralDirectives = await mapStructuralDirectives(node.structuralDirectives, compilerContext);
  const structuralConditionalBindings = await mapStructuralConditionalBindings(node.conditionalBindings, compilerContext);
  const hasChildren = !!node.children.length;
  const nodeName = getElementIdentifier(node, parentNode, index);
  const retVal = {
    code: [],
    functionsToProcess: /* @__PURE__ */ new Map()
  };
  const precode = overrideCreateElement(tagName);
  if (precode) {
    retVal.code.push(precode);
  }
  retVal.code.push(`_renderElement(${parentNode}, context, ${anchor}, '${tagName}',`);
  appendArgument(retVal.code, attributes);
  appendArgument(retVal.code, events);
  appendArgument(retVal.code, conditionalBindings);
  appendArgument(retVal.code, directives);
  appendArgument(retVal.code, structuralDirectives);
  appendArgument(retVal.code, structuralConditionalBindings);
  hasChildren ? retVal.code.push(
    indent(`(${nodeName}, parentContext) => ${nodeName}Children.call(this, ${nodeName}, parentContext)`),
    ");"
  ) : retVal.code[retVal.code.length - 1] = `${retVal.code[retVal.code.length - 1]} null);`;
  switch (tagName) {
    case "svg":
    case "math":
      retVal.code.push("context.createElement = _createElement;");
  }
  if (hasChildren) {
    retVal.functionsToProcess.set(`${nodeName}Children`, {
      fn: {
        node,
        parentNode: nodeName,
        context: compilerContext,
        precode: overrideCreateElement(tagName)
      },
      args: [nodeName, "parentContext", "anchor"]
    });
  }
  return retVal;
}
function appendArgument(code, lines) {
  lines.length ? code.push(
    ...indent([
      "[",
      ...indent(lines),
      "],"
    ])
  ) : code[code.length - 1] = `${code[code.length - 1]} [],`;
}
async function mapAttributes(attributes, compilerContext, owner, isCustomElement, isDirective = false) {
  const mappedAttributes = new Array();
  for (let i2 = 0; i2 < attributes.length; i2++) {
    const { name, value } = attributes[i2];
    const retval = [
      "{",
      indent(`name: '${name}',`)
    ];
    if (typeof value === "string") {
      retval.push(
        ...indent([
          `value: ${toStringLiteral(value)},`,
          "setter: _setProperty"
        ])
      );
    } else {
      const { expression, reactive } = resolveExpression(value.expression, compilerContext);
      retval.push(
        ...indent([
          `value: () => ${expression.startsWith("{") ? `(${expression})` : expression},`,
          `setter: ${reactive ? "_setReactiveProperty" : "_setExpressionProperty"}`
        ])
      );
    }
    const extra = new Array();
    if (isCustomElement !== void 0) {
      const metadata = isCustomElement || isDirective ? await compilerContext.cache?.getOrInsert(owner) : void 0;
      const propertyMetadata = metadata?.properties.get(name);
      if (propertyMetadata) {
        if (!propertyMetadata.required) {
          retval[retval.length - 1] = `${retval[retval.length - 1]},`;
          extra.push("unbind: _setExpressionProperty,", `defaultValue: ${propertyMetadata.defaultValue}`);
        }
      } else if (isDirective) {
        throw new Error(`Unable to resolve the metadata of property "${name}" of ${owner}`, { cause: attributes[i2].span });
      } else {
        retval[retval.length - 1] = `${retval[retval.length - 1]},`;
        extra.push("unbind: _removeAttribute");
      }
    }
    retval.push(
      ...indent(extra),
      "},"
    );
    mappedAttributes.push(...retval);
  }
  return mappedAttributes;
}
function mapEvents(events, compilerContext) {
  compilerContext.addUnresolvableIdentifier("$event");
  const mappedEvents = events.map((event) => {
    let parsedEventParameter = false;
    const parameters = event.parameters.map((parameter) => {
      const resolvedParameter = resolveExpression(parameter, compilerContext).expression;
      if (!parsedEventParameter && resolvedParameter === "$event") {
        parsedEventParameter = true;
        return `($event) => ${resolvedParameter},`;
      } else {
        return `() => ${resolvedParameter},`;
      }
    });
    const eventCode = [
      "{",
      ...indent([
        `name: '${event.name}',`,
        `handler: '${event.handler}',`,
        "parameters: ["
      ])
    ];
    if (parameters.length) {
      eventCode.push(
        ...indent([
          ...indent(parameters),
          "]"
        ]),
        "},"
      );
    } else {
      eventCode[eventCode.length - 1] = `${eventCode[eventCode.length - 1]}]`;
      eventCode.push("},");
    }
    return eventCode;
  }).flat();
  compilerContext.removeUnresolvabledIdentifier("$event");
  return mappedEvents;
}
async function mapConditionalBindings(conditionalBindings, compilerContext, owner, isCustomElement = false, isDirective = false) {
  return mapConditionalBindingDescriptors(conditionalBindings, compilerContext, isEmptyBranch, (branch, condition) => mapBranch(branch, condition, compilerContext, owner, isCustomElement, isDirective));
}
async function mapStructuralConditionalBindings(conditionalBindings, compilerContext) {
  return mapConditionalBindingDescriptors(conditionalBindings, compilerContext, (branch) => !appliesStructuralDirectives(branch), (branch, condition) => mapStructuralBranch(branch, condition, compilerContext));
}
async function mapConditionalBindingDescriptors(conditionalBindings, compilerContext, isEmpty, mapBranch2) {
  const mappedConditionalBindings = new Array();
  for (let i2 = 0; i2 < conditionalBindings.length; i2++) {
    const conditionalBinding = conditionalBindings[i2];
    const { branches } = conditionalBinding;
    if (branches.every(isEmpty)) {
      continue;
    }
    const mappedBranches = new Array();
    for (let j = 0; j < branches.length; j++) {
      mappedBranches.push(...await mapBranch2(branches[j], mapCondition(conditionalBinding, j, compilerContext)));
    }
    const retVal = ["{"];
    if (conditionalBinding.type === 13 /* SwitchBinding */) {
      retVal.push(indent(`expression: () => ${resolveExpression(conditionalBinding.expression, compilerContext).expression},`));
    }
    retVal.push(
      ...indent([
        "branches: [",
        ...indent(mappedBranches),
        "]"
      ]),
      "},"
    );
    mappedConditionalBindings.push(...retVal);
  }
  ;
  return mappedConditionalBindings;
}
function isEmptyBranch({ attributes, events, conditionalBindings, directives }) {
  return !attributes.length && !events.length && !directives.length && conditionalBindings.every(({ branches }) => branches.every(isEmptyBranch));
}
function appliesStructuralDirectives({ structuralDirectives, conditionalBindings }) {
  return !!structuralDirectives.length || conditionalBindings.some(({ branches }) => branches.some(appliesStructuralDirectives));
}
function mapCondition(conditionalBinding, index, compilerContext) {
  if (conditionalBinding.type === 13 /* SwitchBinding */) {
    const { condition: condition2 } = conditionalBinding.branches[index];
    return [`condition: ${condition2 ? `[${condition2.join(", ")}]` : "null"},`];
  }
  const { condition } = conditionalBinding.branches[index];
  return condition ? [`condition: () => ${resolveExpression(condition, compilerContext).expression},`] : [];
}
async function mapBranch(branch, condition, compilerContext, owner, isCustomElement, isDirective) {
  const { attributes, events, conditionalBindings, directives } = branch;
  const mappedAttributes = await mapAttributes(attributes, compilerContext, owner, isCustomElement, isDirective);
  const mappedEvents = mapEvents(events, compilerContext);
  const mappedConditionalBindings = await mapConditionalBindings(conditionalBindings, compilerContext, owner, isCustomElement, isDirective);
  const retVal = [
    "{",
    ...indent(condition)
  ];
  retVal.push(...indent([
    ...mapList("attributes", mappedAttributes),
    ...mapList("events", mappedEvents),
    ...mapList("conditionalBindings", mappedConditionalBindings)
  ]));
  if (!isDirective) {
    const mappedDirectives = await mapDirectives(directives, compilerContext);
    retVal.push(...indent(mapList("directives", mappedDirectives)));
  }
  retVal.push("},");
  return retVal;
}
async function mapDirectives(directives, compilerContext) {
  const mappedDirectives = new Array();
  for (let i2 = 0; i2 < directives.length; i2++) {
    const { selector, attributes, events, conditionalBindings } = directives[i2];
    const mappedAttributes = await mapAttributes(attributes, compilerContext, selector);
    const mappedEvents = mapEvents(events, compilerContext);
    const mappedConditionalBindings = await mapConditionalBindings(conditionalBindings, compilerContext, `@@${selector}`, false, true);
    const retVal = [
      "{",
      ...indent([
        `selector: '${selector}',`
      ])
    ];
    retVal.push(...indent([
      ...mapList("attributes", mappedAttributes),
      ...mapList("events", mappedEvents),
      ...mapList("conditionalBindings", mappedConditionalBindings, "")
    ]));
    retVal.push("},");
    mappedDirectives.push(...retVal);
  }
  return mappedDirectives;
}
async function mapStructuralBranch(branch, condition, compilerContext) {
  const mappedStructuralDirectives = await mapStructuralDirectives(branch.structuralDirectives, compilerContext);
  const mappedConditionalBindings = await mapStructuralConditionalBindings(branch.conditionalBindings, compilerContext);
  return [
    "{",
    ...indent([
      ...condition,
      ...mapList("structuralDirectives", mappedStructuralDirectives),
      ...mapList("conditionalBindings", mappedConditionalBindings)
    ]),
    "},"
  ];
}
async function mapStructuralDirectives(structuralDirectives, compilerContext) {
  const mappedStructuralDirectives = new Array();
  for (let i2 = 0; i2 < structuralDirectives.length; i2++) {
    const { selector, attributes } = structuralDirectives[i2];
    mappedStructuralDirectives.push(
      "{",
      ...indent([
        `selector: '${selector}',`,
        ...mapList("attributes", await mapAttributes(attributes, compilerContext, selector), "")
      ]),
      "},"
    );
  }
  return mappedStructuralDirectives;
}
function mapList(name, lines, separator = ",") {
  return lines.length ? [
    `${name}: [`,
    ...indent(lines),
    `]${separator}`
  ] : [`${name}: []${separator}`];
}
function overrideCreateElement(tagName) {
  switch (tagName) {
    case "svg":
      return "context.createElement = _createSVGElement;";
    case "math":
      return "context.createElement = _createMATHMLElement;";
    default:
      return "";
  }
}

// ../packages/compiler/src/generator/states/generate-for/generate-for.state.ts
async function generateFor(node, parentNode, index, compilerContext, anchor) {
  const retVal = {
    code: [],
    functionsToProcess: /* @__PURE__ */ new Map()
  };
  const iterableExpr = resolveExpression(node.iterableExpression, compilerContext).expression;
  const itemName = node.itemAlias ?? "_";
  const itemsName = getTextIdentifier("items", parentNode, index);
  const counterName = getTextIdentifier("i", parentNode, index);
  const indexName = resolveImplicit(node, "$index");
  const firstName = resolveImplicit(node, "$first");
  const lastName = resolveImplicit(node, "$last");
  const evenName = resolveImplicit(node, "$even");
  const oddName = resolveImplicit(node, "$odd");
  const forContext = new CompilerContext(compilerContext);
  if (node.itemAlias) {
    forContext.addIdentifier(node.itemAlias);
  }
  const identifiers = [indexName, firstName, lastName, evenName, oddName];
  for (let i2 = 0; i2 < identifiers.length; i2++) {
    forContext.addIdentifier(identifiers[i2], "signal");
  }
  const forKey = getBlockIdentifier("for", parentNode, index);
  retVal.functionsToProcess.set(forKey, {
    fn: {
      precode: `const { vars, update } = _iterationVariables(context, ${itemsName}, ${counterName}, ${node.itemAlias ? `'${node.itemAlias}'` : void 0}, {
    $index: '${indexName}', 
    $first: '${firstName}', 
    $last: '${lastName}', 
    $even: '${evenName}', 
    $odd: '${oddName}' 
  });
  const { ${[node.itemAlias, ...identifiers].filter(Boolean).join(", ")} } = vars;`,
      node,
      parentNode: forKey,
      context: forContext,
      anchor: "anchor",
      isForBody: true
    },
    args: [forKey, "parentContext", itemsName, counterName, "anchor"]
  });
  retVal.code.push(`_for(${parentNode}, context, ${anchor}, () => ${iterableExpr}, (${itemName}, ${indexName}) => ${resolveExpression(node.trackExpression, forContext, { skipResolution: true }).expression}, ${forKey}.bind(this));`);
  return retVal;
}
function resolveImplicit(node, implicit) {
  return node.implicitAliases.get(implicit) ?? implicit;
}

// ../packages/compiler/src/generator/states/generate-if/generate-if.state.ts
async function generateIf(node, parentNode, index, compilerContext, anchor) {
  const ifContext = new CompilerContext(compilerContext);
  const retVal = {
    code: [],
    functionsToProcess: /* @__PURE__ */ new Map()
  };
  retVal.code.push(`_if(${parentNode}, context, ${anchor}, [`);
  const ifKey = getBlockIdentifier("if", parentNode, index);
  retVal.code.push(
    ...indent([
      "{",
      ...indent([`condition: () => ${resolveExpression(node.conditionNode, compilerContext).expression},`, `block: ${ifKey}.bind(this)`]),
      "},"
    ])
  );
  retVal.functionsToProcess.set(ifKey, {
    fn: { node, parentNode: ifKey, context: ifContext, anchor: "anchor" },
    args: [ifKey, "parentContext", "anchor"]
  });
  let alt = node.alternate;
  let i2 = 0;
  while (alt?.type === 7 /* ElseIf */) {
    const elseIfContext = new CompilerContext(compilerContext);
    const keyElseIf = getBlockIdentifier("elseIf", parentNode, `${index}_${i2}`);
    const conditionNode = alt.conditionNode;
    retVal.code.push(
      ...indent([
        "{",
        ...indent([`condition: () => ${resolveExpression(conditionNode, compilerContext).expression},`, `block: ${keyElseIf}.bind(this)`]),
        "},"
      ])
    );
    retVal.functionsToProcess.set(keyElseIf, {
      fn: { node: alt, parentNode, context: elseIfContext, anchor: "anchor" },
      args: [parentNode, "parentContext", "anchor"]
    });
    alt = alt.alternate;
    i2++;
  }
  if (alt) {
    const elseContext = new CompilerContext(compilerContext);
    const keyElse = getBlockIdentifier("else", parentNode, index);
    retVal.code.push(
      ...indent([
        "{",
        ...indent([`block: ${keyElse}.bind(this)`]),
        "},"
      ])
    );
    retVal.functionsToProcess.set(keyElse, {
      fn: { node: alt, parentNode, context: elseContext, anchor: "anchor" },
      args: [parentNode, "parentContext", "anchor"]
    });
  }
  retVal.code.push("]);");
  return retVal;
}

// ../packages/compiler/src/generator/states/generate-switch/generate-switch.state.ts
async function generateSwitch(node, parentNode, index, compilerContext, anchor) {
  const retVal = {
    code: [],
    functionsToProcess: /* @__PURE__ */ new Map()
  };
  retVal.code.push(`_switch(${parentNode}, context, ${anchor}, () => ${resolveExpression(node.expression, compilerContext).expression}, [`);
  const children = node.children;
  for (let i2 = 0; i2 < children.length; i2++) {
    const caseNode = children[i2];
    const caseContext = new CompilerContext(compilerContext);
    const caseKey = caseNode.condition ? getBlockIdentifier("case", parentNode, `${index}_${i2}`) : getBlockIdentifier("default", parentNode, index);
    retVal.functionsToProcess.set(caseKey, {
      fn: { node: caseNode, parentNode: caseKey, context: caseContext, anchor: "anchor" },
      args: [caseKey, "parentContext", "anchor"]
    });
    const fnName = `${caseKey}.bind(this)`;
    retVal.code.push(
      ...indent([
        "{",
        ...indent([`condition: ${caseNode.condition ? `[${caseNode.condition.join(", ")}]` : "null"},`, `block: ${fnName}`]),
        "},"
      ])
    );
  }
  ;
  retVal.code.push("])");
  return retVal;
}

// ../packages/compiler/src/generator/states/generate-text-and-interpolation/generate-text-and-interpolation.state.ts
async function generateTextAndInterpolation(node, parentNode, _index, compilerContext, anchor) {
  return {
    code: [
      `${node.type === 3 /* Text */ ? `_renderLiteralText(${parentNode}, context, ${toStringLiteral(node.value)}, ${anchor});` : `_renderText(${parentNode}, context, () => ${resolveExpression(node.expression, compilerContext).expression}, ${anchor});`}`
    ]
  };
}

// ../packages/compiler/src/generator/states/skip-generation/skip-generation.state.ts
async function skipGeneration(_node, _parentNode, _index, _compilerContext) {
  return;
}

// ../packages/compiler/src/generator/generator/generator.ts
var Generator = class {
  /**
   * Initializes a new instance of the Generator class with the given input and AST.
   * @param _input The input source code as a string.
   * @param _ast The abstract syntax tree representing the parsed structure of the input.
   */
  constructor(_input, _ast, _cache) {
    this._input = _input;
    this._ast = _ast;
    this._cache = _cache;
  }
  /**
   * Map storing nodes that need to be processed along with their associated functions.
   */
  _nodeToProcess = /* @__PURE__ */ new Map();
  /**
   * Map of generator states corresponding to different AST node types.
   */
  _states = {
    [3 /* Text */]: generateTextAndInterpolation,
    [4 /* Interpolation */]: generateTextAndInterpolation,
    [0 /* Element */]: generateElement,
    [5 /* If */]: generateIf,
    [8 /* For */]: generateFor,
    [9 /* Switch */]: generateSwitch,
    [11 /* Import */]: skipGeneration
  };
  /**
   * Generates the code for the given AST using the specified signals.
   * @param signals An array of signal names to be included in the generated code.
   * @returns The generated code as a string: module-level functions, the entry point being `render`,
   *   each expecting to be invoked with the component instance bound as `this`.
   */
  async generate(signals) {
    const processFunctions = (functionsToProcess) => {
      if (functionsToProcess) {
        for (const [key, value] of functionsToProcess.entries()) {
          this._nodeToProcess.set(key, value);
        }
      }
    };
    try {
      this._nodeToProcess.clear();
      const compilerContext = new CompilerContext();
      compilerContext.cache = this._cache;
      for (let i2 = 0; i2 < signals.length; i2++) {
        compilerContext.addSignalClassField(signals[i2]);
      }
      const generatedCode = [
        "function render() {",
        ...indent([
          `const ${ROOT_NODE} = this._root;`,
          "const context = new _Context(this, { createElement: document.createElement.bind(document), get: () => undefined });"
        ])
      ];
      for (let i2 = 0; i2 < this._ast.length; i2++) {
        const result = await this._processNode(this._ast[i2], ROOT_NODE, i2.toString(), compilerContext, null);
        if (result) {
          const { code, functionsToProcess } = result;
          processFunctions(functionsToProcess);
          generatedCode.push(...indent(code));
        }
      }
      generatedCode.push(
        ...indent(["return context;"]),
        "}"
      );
      for (const [key, fnData] of this._nodeToProcess.entries()) {
        const { node, parentNode, context, precode, anchor } = fnData.fn;
        generatedCode.push(
          `
function ${key}(${fnData.args?.join(", ")}) {`,
          ...indent(["const context = new _Context(this, parentContext);"])
        );
        if (precode) {
          generatedCode.push(indent(precode));
        }
        const functionBody = new Array();
        for (let i2 = 0; i2 < node.children.length; i2++) {
          const child = node.children[i2];
          const result = await this._processNode(child, parentNode, i2.toString(), context, anchor ?? null);
          if (result) {
            const { code, functionsToProcess } = result;
            processFunctions(functionsToProcess);
            functionBody.push(...code);
          }
        }
        generatedCode.push(
          ...indent([
            ...functionBody,
            fnData.fn.isForBody ? "return { context, update };" : "return context;"
          ]),
          "}"
        );
      }
      return generatedCode.join("\n");
    } catch (err) {
      throw catchErrorWithPrefix("Generator", this._input, err);
    }
  }
  /**
   * Processes a single AST node and generates the corresponding code.
   * @param node The AST node to process.
   * @param parentNode The variable name of the parent node in the generated code.
   * @param index The index of the node among its siblings.
   * @param compilerContext The context object containing compiler-related information.
   * @param anchor The anchor point for inserting the generated code, if applicable.
   * @returns The result of processing the node, including generated code and functions to process, or undefined if no code is generated.
   */
  async _processNode(node, parentNode, index, compilerContext, anchor) {
    const state = this._states[node.type];
    if (!state) {
      throw new Error(`No transition function for ASTNode of type ${ASTNodeType[node.type]}`, { cause: node.span });
    }
    return await state(node, parentNode, index, compilerContext, anchor);
  }
};

// ../packages/compiler/src/costants/chars.constants.ts
var EOF = 0;
var TAB = 9;
var LF = 10;
var CR = 13;
var SPACE = 32;
var DOUBLE_QUOTE = 34;
var SINGLE_QUOTE = 39;
var LPAREN = 40;
var RPAREN = 41;
var STAR = 42;
var COMMA = 44;
var SLASH = 47;
var LESS_THAN = 60;
var EQUAL_THEN = 61;
var GREATER_THEN = 62;
var AT_SIGN = 64;
var LEFT_BRACKET = 91;
var RIGHT_BRACKET = 93;
var GRAVE_ACCENT = 96;
var LEFT_BRACE = 123;
var RIGHT_BRACE = 125;

// ../packages/compiler/src/lexer/types/token-type.enum.ts
var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2[TokenType2["TEXT"] = 0] = "TEXT";
  TokenType2[TokenType2["TAG_OPEN_NAME"] = 1] = "TAG_OPEN_NAME";
  TokenType2[TokenType2["TAG_SELF_CLOSE"] = 2] = "TAG_SELF_CLOSE";
  TokenType2[TokenType2["TAG_OPEN_END"] = 3] = "TAG_OPEN_END";
  TokenType2[TokenType2["TAG_CLOSE_NAME"] = 4] = "TAG_CLOSE_NAME";
  TokenType2[TokenType2["ATTRIBUTE"] = 5] = "ATTRIBUTE";
  TokenType2[TokenType2["ATTRIBUTE_VALUE"] = 6] = "ATTRIBUTE_VALUE";
  TokenType2[TokenType2["EVENT"] = 7] = "EVENT";
  TokenType2[TokenType2["EVENT_HANDLER"] = 8] = "EVENT_HANDLER";
  TokenType2[TokenType2["EVENT_PARAMETER"] = 9] = "EVENT_PARAMETER";
  TokenType2[TokenType2["INTERPOLATION_LITERAL"] = 10] = "INTERPOLATION_LITERAL";
  TokenType2[TokenType2["INTERPOLATION_EXPRESSION"] = 11] = "INTERPOLATION_EXPRESSION";
  TokenType2[TokenType2["IF"] = 12] = "IF";
  TokenType2[TokenType2["FOR"] = 13] = "FOR";
  TokenType2[TokenType2["ELSE"] = 14] = "ELSE";
  TokenType2[TokenType2["ELSE_IF"] = 15] = "ELSE_IF";
  TokenType2[TokenType2["SWITCH"] = 16] = "SWITCH";
  TokenType2[TokenType2["CASE"] = 17] = "CASE";
  TokenType2[TokenType2["DEFAULT"] = 18] = "DEFAULT";
  TokenType2[TokenType2["CONDITION"] = 19] = "CONDITION";
  TokenType2[TokenType2["BLOCK_OPEN"] = 20] = "BLOCK_OPEN";
  TokenType2[TokenType2["BLOCK_CLOSE"] = 21] = "BLOCK_CLOSE";
  TokenType2[TokenType2["IMPORT"] = 22] = "IMPORT";
  TokenType2[TokenType2["IMPORT_PATH"] = 23] = "IMPORT_PATH";
  TokenType2[TokenType2["DIRECTIVE"] = 24] = "DIRECTIVE";
  TokenType2[TokenType2["DIRECTIVE_CLOSE"] = 25] = "DIRECTIVE_CLOSE";
  TokenType2[TokenType2["STRUCTURAL_DIRECTIVE"] = 26] = "STRUCTURAL_DIRECTIVE";
  TokenType2[TokenType2["EOF"] = 27] = "EOF";
  return TokenType2;
})(TokenType || {});

// ../packages/compiler/src/lexer/utils/tag-body-state/tag-body-state.utils.ts
function resolveTagBodyState(openingState) {
  switch (openingState) {
    case "flow-control-block" /* FLOW_CONTROL_BLOCK */:
      return "conditional-binding-body" /* CONDITIONAL_BINDING_BODY */;
    case "directive" /* DIRECTIVE */:
    case "structural-directive" /* STRUCTURAL_DIRECTIVE */:
      return "directive-body" /* DIRECTIVE_BODY */;
    default:
      return "tag-body" /* TAG_BODY */;
  }
}

// ../packages/compiler/src/lexer/states/lex-attribute-value/lex-attribute-value.state.ts
function lexAttributeValue(cursor, context) {
  let read = true;
  let value = "";
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      case DOUBLE_QUOTE:
        cursor.advance();
        read = false;
        retVal = {
          // Last state is the attribute, so we need to look two steps back in the history to determine the correct next state.
          state: resolveTagBodyState(context.history.at(-2)),
          tokens: [{
            type: 6 /* ATTRIBUTE_VALUE */,
            parts: [value]
          }],
          popState: true
        };
        break;
      default:
        cursor.advance();
        value = `${value}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-attribute/lex-attribute.state.ts
function lexAttribute(cursor, context) {
  let read = true;
  let attribute = "";
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      /*
              Cover the cases where the attribute is applied without any value
              Ex:
              <input disabled />
      
              A tag can span multiple lines, so the attribute name can also be followed
              by a tab or a line break instead of a space.
            */
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.advance();
        read = false;
        retVal = {
          state: resolveTagBodyState(context.history.at(-1)),
          tokens: [{
            type: 5 /* ATTRIBUTE */,
            parts: [attribute]
          }]
        };
        break;
      /*
        Cover cases where the attribute name is immediately followed by '>' or '/'
        without a separating space.
        Ex:
        <input disabled>
        <input disabled/>
      */
      case GREATER_THEN:
      case SLASH:
        read = false;
        retVal = {
          state: resolveTagBodyState(context.history.at(-1)),
          tokens: [{
            type: 5 /* ATTRIBUTE */,
            parts: [attribute]
          }]
        };
        break;
      /*
              Cover cases where the attribute name is immediately followed by the ')'
              closing a directive, without a separating space.
              The ')' is left to the directive body, which closes the directive.
              Ex:
              <input @@myDirective(disabled) />
      
              Outside of a directive there is nothing for ')' to close.
            */
      case RPAREN:
        if (resolveTagBodyState(context.history.at(-1)) !== "directive-body" /* DIRECTIVE_BODY */) {
          throw new Error("Unexpected ')': there is no directive to close");
        }
        read = false;
        retVal = {
          state: "directive-body" /* DIRECTIVE_BODY */,
          tokens: [{
            type: 5 /* ATTRIBUTE */,
            parts: [attribute]
          }]
        };
        break;
      /*
              Cover cases where the attribute name is immediately followed by the '}'
              closing a block of a conditional binding, without a separating space.
              The '}' is left to the conditional binding body, which closes the block.
              Ex:
              <input @if (isDisabled()) { disabled} />
      
              Outside of a conditional binding there is nothing for '}' to close.
            */
      case RIGHT_BRACE:
        if (resolveTagBodyState(context.history.at(-1)) !== "conditional-binding-body" /* CONDITIONAL_BINDING_BODY */) {
          throw new Error("Unexpected '}': there is no conditional binding to close");
        }
        read = false;
        retVal = {
          state: "conditional-binding-body" /* CONDITIONAL_BINDING_BODY */,
          tokens: [{
            type: 5 /* ATTRIBUTE */,
            parts: [attribute]
          }]
        };
        break;
      /*
        '(' opens an event binding, so it cannot be part of an attribute name:
        it means the separating space before the event binding is missing.
        Ex:
        <input disabled(input)="onInput()" />
      */
      case LPAREN:
        throw new Error("Unexpected '(' in attribute name: event bindings must be separated from the previous binding by a space");
      case EQUAL_THEN:
        if (!attribute) {
          throw new Error("Attribute cannot start with '='");
        }
        cursor.advance();
        if (cursor.peek() !== DOUBLE_QUOTE) {
          throw `Attribute value must start with double quotes '"'`;
        }
        cursor.advance();
        read = false;
        const isInterpolatedValue = cursor.peek() === LEFT_BRACE;
        retVal = {
          state: isInterpolatedValue ? "interpolation" /* INTERPOLATION */ : "attribute-value" /* ATTRIBUTE_VALUE */,
          /*
                      This push is needed by
                      - Interpolation Expression
                      - Interpolation Literal
          
                      When we go back to their calling state, we need to consume Double Quotes '"'
                      if we arrived there from an Attribute Value state, otherwise we are arrived from 'tag body' (or others in the future) state.
                      In the case of 'tag body', we do not need to consume the double quotes beacuse there are no surrounding quotes to handle.
          
                      Example:
                        <input class="{expression}" /> <-- We must consume Double Quotes
          
                        <div>
                          {expression}                 <-- We do not need to consume Double Quotes
                        </div>
          
                     */
          pushState: true,
          tokens: [{
            type: 5 /* ATTRIBUTE */,
            parts: [attribute]
          }]
        };
        break;
      case DOUBLE_QUOTE:
      case SINGLE_QUOTE:
        if (!attribute) {
          throw new Error(`Attribute cannot start with ' or "`);
        }
      default:
        cursor.advance();
        attribute = `${attribute}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/utils/lex-flow-control-condition/lex-flow-control-condition.utils.ts
function lexFlowControlCondition(cursor, _context) {
  cursor.skipSpaces();
  if (cursor.peek() !== LPAREN) {
    throw `Expected '(' but got '${String.fromCharCode(cursor.peek())}'`;
  }
  cursor.advance();
  let expression = "";
  let depth = 1;
  while (depth > 0) {
    const code = cursor.peek();
    switch (code) {
      case LPAREN:
        depth++;
        expression = addCharacter(cursor, expression);
        break;
      case RPAREN:
        depth--;
        if (!depth) {
          cursor.advance();
          break;
        }
        expression = addCharacter(cursor, expression);
        break;
      default:
        expression = addCharacter(cursor, expression);
    }
  }
  return expression;
}
function addCharacter(cursor, expression) {
  cursor.advance();
  return `${expression}${cursor.currentChar.value}`;
}

// ../packages/compiler/src/lexer/states/lex-case-flow-control-condition/lex-case-flow-control-condition.state.ts
function lexCaseFlowControlCondition(cursor, context) {
  const condition = lexFlowControlCondition(cursor, context);
  cursor.skipSpaces();
  return {
    state: cursor.peekMatch("@case") ? "flow-control" /* FLOW_CONTROL */ : "flow-control-block" /* FLOW_CONTROL_BLOCK */,
    tokens: [{
      type: 19 /* CONDITION */,
      parts: [condition]
    }],
    popState: true
  };
}

// ../packages/compiler/src/lexer/utils/conditional-binding/conditional-binding.utils.ts
var KEYWORD = /^@(?:if|else|switch|case|default) /;
var LONGEST_KEYWORD_LENGTH = "@default ".length;
function isConditionalBindingKeyword(cursor) {
  return cursor.peekMatch(KEYWORD, LONGEST_KEYWORD_LENGTH);
}

// ../packages/compiler/src/lexer/states/lex-directive-body/lex-directive-body.state.ts
function lexDirectiveBody(cursor, context) {
  const structural = context.history.at(-1) === "structural-directive" /* STRUCTURAL_DIRECTIVE */;
  let read = true;
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        if (cursor.peekMatch("@@")) {
          throw "Directives cannot be declared inside another directive";
        }
        if (structural) {
          throw "The properties of a structural directive cannot be bound conditionally";
        }
        if (!isConditionalBindingKeyword(cursor)) {
          throw `'@' must start a conditional binding (@if, @else, @switch, @case, @default): events are bound with (eventName)="handler()"`;
        }
        retVal = {
          state: "flow-control" /* FLOW_CONTROL */
        };
        read = false;
        break;
      case STAR:
        throw "Directives cannot be declared inside another directive";
      // A tag can span multiple lines: tabs and line breaks separate the bindings exactly like spaces
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.skipSpaces();
        break;
      case RPAREN:
        cursor.advance();
        retVal = {
          /*
            The last state of the history is the DIRECTIVE (or STRUCTURAL_DIRECTIVE) one opening this body, the one before
            tells where the directive was declared: in the tag body or inside a conditional binding.
          */
          state: resolveTagBodyState(context.history.at(-2)),
          tokens: [{
            type: 25 /* DIRECTIVE_CLOSE */
          }],
          popState: true
        };
        read = false;
        break;
      case LPAREN:
        if (structural) {
          throw "Structural directives cannot listen to events: they hold no element to dispatch them on";
        }
        retVal = {
          state: "event" /* EVENT */
        };
        read = false;
        break;
      case GREATER_THEN:
      case SLASH:
        throw "Directive bindings must be closed by ')'";
      default:
        retVal = {
          state: "attribute" /* ATTRIBUTE */
        };
        read = false;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-directive/lex-directive.state.ts
function lexDirective(cursor, context) {
  return lexSelector(cursor, context, 24 /* DIRECTIVE */);
}
function lexStructuralDirective(cursor, context) {
  return lexSelector(cursor, context, 26 /* STRUCTURAL_DIRECTIVE */);
}
function lexSelector(cursor, context, type) {
  let read = true;
  let selector = "";
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      case LPAREN:
        assertSelector(selector);
        cursor.advance();
        retVal = {
          state: "directive-body" /* DIRECTIVE_BODY */,
          tokens: [{
            type,
            parts: [selector]
          }],
          pushState: true
        };
        read = false;
        break;
      case RPAREN:
        throw new Error("Unexpected ')': there is no directive to close");
      case RIGHT_BRACE:
        if (resolveTagBodyState(context.history.at(-1)) !== "conditional-binding-body" /* CONDITIONAL_BINDING_BODY */) {
          throw new Error("Unexpected '}': there is no conditional binding to close");
        }
      /*
              Break is missing on purpose: the '}' is left to the conditional binding body,
              which closes the block, exactly like the other characters ending the selector.
      
              A tag can span multiple lines, so the selector can also be ended by a tab or a line break.
            */
      case SPACE:
      case TAB:
      case LF:
      case CR:
      case GREATER_THEN:
      case SLASH:
        assertSelector(selector);
        retVal = {
          state: resolveTagBodyState(context.history.at(-1)),
          tokens: [
            {
              type,
              parts: [selector]
            },
            {
              type: 25 /* DIRECTIVE_CLOSE */
            }
          ]
        };
        read = false;
        break;
      case EQUAL_THEN:
        throw type === 24 /* DIRECTIVE */ ? 'Directive bindings must be declared between parentheses, e.g. @@selector(name="value")' : 'Structural directive bindings must be declared between parentheses, e.g. *selector(name="value")';
      default:
        cursor.advance();
        selector = `${selector}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}
function assertSelector(selector) {
  if (!selector) {
    throw "Directive selector cannot be empty";
  }
}

// ../packages/compiler/src/lexer/states/lex-default-flow-control-condition/lex-default-flow-control-condition.state.ts
function lexDefaultFlowControlCondition(cursor, context) {
  return {
    state: "flow-control-block" /* FLOW_CONTROL_BLOCK */,
    tokens: [{
      type: 19 /* CONDITION */,
      parts: [lexFlowControlCondition(cursor, context)]
    }],
    popState: true
  };
}

// ../packages/compiler/src/lexer/states/lex-conditional-binding-body/lex-conditional-binding-body.state.ts
function lexConditionalBindingBody(cursor, context) {
  let read = true;
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        let state;
        if (isConditionalBindingKeyword(cursor)) {
          state = "flow-control" /* FLOW_CONTROL */;
        } else if (cursor.peekMatch("@@")) {
          if (context.history.includes("directive" /* DIRECTIVE */)) {
            throw "Directives cannot be declared inside another directive";
          }
          state = "directive" /* DIRECTIVE */;
          cursor.advance(2);
        } else {
          throw `'@' must start a conditional binding (@if, @else, @switch, @case, @default) or a directive (@@selector): events are bound with (eventName)="handler()"`;
        }
        retVal = {
          state
        };
        read = false;
        break;
      case STAR:
        if (context.history.includes("directive" /* DIRECTIVE */)) {
          throw "Directives cannot be declared inside another directive";
        }
        cursor.advance();
        retVal = {
          state: "structural-directive" /* STRUCTURAL_DIRECTIVE */
        };
        read = false;
        break;
      // A tag can span multiple lines: tabs and line breaks separate the bindings exactly like spaces
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.skipSpaces();
        break;
      case RIGHT_BRACE:
        cursor.advance();
        retVal = {
          /*
            The last state of the history is the FLOW_CONTROL_BLOCK one opening this block, the one before
            tells where the conditional binding was declared: in the tag body, inside a directive
            or in a block of another conditional binding.
          */
          state: resolveTagBodyState(context.history.at(-2)),
          tokens: [{
            type: 21 /* BLOCK_CLOSE */
          }],
          popState: true
        };
        read = false;
        break;
      case LPAREN:
        retVal = {
          state: "event" /* EVENT */
        };
        read = false;
        break;
      case GREATER_THEN:
      case SLASH:
        throw "Conditional binding blocks must be closed by '}'";
      default:
        retVal = {
          state: "attribute" /* ATTRIBUTE */
        };
        read = false;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-event-handler/lex-event-handler.state.ts
function lexEventHandler(cursor, context) {
  let read = true;
  let handlerName = "";
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      // Tabs and line breaks are no more part of the name than spaces are
      case SPACE:
      case TAB:
      case LF:
      case CR:
        throw "No spaces are allowed in event handler name";
      case LPAREN:
        if (!handlerName) {
          throw "Event handler cannot be empty";
        }
        let state = "parameter" /* EVENT_PARAMETER */;
        cursor.advance();
        if (cursor.peekMatch(')"')) {
          cursor.advance(2);
          state = resolveTagBodyState(context.history.at(-1));
        }
        retVal = {
          state,
          tokens: [{
            type: 8 /* EVENT_HANDLER */,
            parts: [handlerName]
          }]
        };
        read = false;
        break;
      default:
        cursor.advance();
        handlerName = `${handlerName}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-event-parameter/lex-event-parameter.state.ts
function lexEventParameter(cursor, context) {
  let read = true;
  let eventParameter = "";
  let charDelimiter = "";
  let parameterStart = cursor.currentChar.index + 1;
  const retVal = {
    state: resolveTagBodyState(context.history.at(-1)),
    tokens: []
  };
  while (read) {
    switch (cursor.peek()) {
      case LEFT_BRACKET:
      case RIGHT_BRACKET:
      case LEFT_BRACE:
      case RIGHT_BRACE:
      case DOUBLE_QUOTE:
      case SINGLE_QUOTE:
      case LPAREN:
        eventParameter = addCharacter2(cursor, eventParameter);
        if (!charDelimiter) {
          charDelimiter = cursor.currentChar.value;
        } else if (charDelimiter === cursor.currentChar.value || charDelimiter === "[" && cursor.currentChar.value === "]" || charDelimiter === "{" && cursor.currentChar.value === "}") {
          charDelimiter = "";
        }
        break;
      case COMMA:
        if (!charDelimiter) {
          const parameterEnd = cursor.currentChar.index + 1;
          retVal.tokens.push({
            type: 9 /* EVENT_PARAMETER */,
            parts: [eventParameter],
            span: {
              start: parameterStart,
              end: parameterEnd
            }
          });
          cursor.advance();
          cursor.skipSpaces();
          eventParameter = "";
          parameterStart = cursor.currentChar.index + 1;
        } else {
          eventParameter = addCharacter2(cursor, eventParameter);
        }
        break;
      case RPAREN:
        cursor.advance();
        if (cursor.peek() !== DOUBLE_QUOTE) {
          throw "Event must be included in Double Quotes";
        }
        cursor.advance();
        if (!charDelimiter) {
          const parameterEnd = cursor.currentChar.index + 1;
          retVal.tokens.push({
            type: 9 /* EVENT_PARAMETER */,
            parts: [eventParameter],
            span: {
              start: parameterStart,
              end: parameterEnd
            }
          });
          read = false;
          break;
        }
        eventParameter = `${eventParameter}${cursor.currentChar.value}`;
        break;
      default:
        eventParameter = addCharacter2(cursor, eventParameter);
    }
  }
  return retVal;
}
function addCharacter2(cursor, eventParameter) {
  cursor.advance();
  return `${eventParameter}${cursor.currentChar.value}`;
}

// ../packages/compiler/src/lexer/states/lex-event/lex-event.state.ts
function isBindinglessDirective(tokens) {
  return tokens.at(-1)?.type === 25 /* DIRECTIVE_CLOSE */ && tokens.at(-2)?.type === 24 /* DIRECTIVE */;
}
function lexEvent(cursor, context) {
  let read = true;
  let eventName = "";
  let retVal;
  cursor.advance();
  while (read) {
    switch (cursor.peek()) {
      // Tabs and line breaks are no more part of the name than spaces are
      case SPACE:
      case TAB:
      case LF:
      case CR:
        throw "No spaces are allowed in event name";
      /*
        Characters that cannot be part of an event name: finding one means the ')'
        closing the name is missing.
        Ex:
        <button (click="onClick()">
        <button (click>
      */
      case LPAREN:
      case EQUAL_THEN:
      case DOUBLE_QUOTE:
      case SINGLE_QUOTE:
      case GREATER_THEN:
      case SLASH:
        throw isBindinglessDirective(context.tokens) ? `Event name must be closed by ')': directive bindings must immediately follow the selector, without spaces, e.g. @@selector(name="value")` : "Event name must be closed by ')'";
      case RPAREN:
        if (!eventName) {
          throw "Event name cannot be empty";
        }
        cursor.advance();
        if (cursor.peek() !== EQUAL_THEN) {
          throw "Event name must be followed by '='";
        }
        cursor.advance();
        if (cursor.peek() !== DOUBLE_QUOTE) {
          throw "Event handler must be included in Double Quotes";
        }
        cursor.advance();
        retVal = {
          state: "event-handler" /* EVENT_HANDLER */,
          tokens: [{
            type: 7 /* EVENT */,
            parts: [eventName]
          }]
        };
        read = false;
        break;
      default:
        cursor.advance();
        eventName = `${eventName}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-flow-control/lex-flow-control.ts
function lexFlowControl(cursor, _context) {
  let retVal;
  cursor.advance();
  if (cursor.peekMatch("for ")) {
    cursor.advance(4);
    retVal = {
      state: "flow-control-condition" /* FLOW_CONTROL_CONDITION */,
      tokens: [{
        type: 13 /* FOR */
      }],
      pushState: true
    };
  } else if (cursor.peekMatch("if ")) {
    cursor.advance(2);
    retVal = {
      state: "flow-control-condition" /* FLOW_CONTROL_CONDITION */,
      tokens: [{
        type: 12 /* IF */
      }],
      pushState: true
    };
  } else if (cursor.peekMatch("else if ")) {
    cursor.advance(8);
    retVal = {
      state: "flow-control-condition" /* FLOW_CONTROL_CONDITION */,
      tokens: [{
        type: 15 /* ELSE_IF */
      }],
      pushState: true
    };
  } else if (cursor.peekMatch("else ")) {
    cursor.advance(5);
    retVal = {
      state: "flow-control-block" /* FLOW_CONTROL_BLOCK */,
      tokens: [{
        type: 14 /* ELSE */
      }]
    };
  } else if (cursor.peekMatch("switch ")) {
    cursor.advance(7);
    retVal = {
      state: "flow-control-condition" /* FLOW_CONTROL_CONDITION */,
      tokens: [{
        type: 16 /* SWITCH */
      }],
      pushState: true
    };
  } else if (cursor.peekMatch("case ")) {
    cursor.advance(5);
    retVal = {
      state: "case-flow-control-condition" /* CASE_FLOW_CONTROL_CONDITION */,
      tokens: [{
        type: 17 /* CASE */
      }],
      pushState: true
    };
  } else if (cursor.peekMatch("default ")) {
    cursor.advance(8);
    retVal = {
      state: "flow-control-block" /* FLOW_CONTROL_BLOCK */,
      tokens: [{
        type: 18 /* DEFAULT */
      }]
    };
  } else if (cursor.peekMatch("import ")) {
    cursor.advance(7);
    retVal = {
      state: "import" /* IMPORT */
    };
  } else {
    throw "Unknown flow-control keyword";
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-flow-control-block/lex-flow-control-block.state.ts
function lexFlowControlBlock(cursor, context) {
  cursor.skipSpaces();
  if (cursor.peek() !== LEFT_BRACE) {
    throw `Expected '{' but got '${String.fromCharCode(cursor.peek())}'`;
  }
  cursor.advance();
  return {
    // The state opening a tag stays on the state stack until the tag is closed.
    state: context.history.includes("tag-open-name" /* TAG_OPEN_NAME */) ? "conditional-binding-body" /* CONDITIONAL_BINDING_BODY */ : "text" /* TEXT */,
    tokens: [{ type: 20 /* BLOCK_OPEN */ }],
    pushState: true
  };
}

// ../packages/compiler/src/lexer/states/lex-import-path/lex-import-path.state.ts
function lexImportPath(cursor, _context) {
  let read = true;
  let path = "";
  let retVal;
  let singleQuote = false;
  cursor.skipSpaces();
  if (!cursor.peekMatch("from")) {
    throw "Expected 'from' keyword after import list";
  }
  cursor.advance(4);
  cursor.skipSpaces();
  cursor.advance();
  switch (cursor.currentChar.code) {
    case SINGLE_QUOTE:
      singleQuote = true;
      break;
    case DOUBLE_QUOTE:
      break;
    default:
      throw `Import statement must start with ' or ".
Found character ${cursor.currentChar.value}`;
  }
  const delimiter = singleQuote ? SINGLE_QUOTE : DOUBLE_QUOTE;
  while (read) {
    switch (cursor.peek()) {
      case delimiter:
        cursor.advance();
        read = false;
        retVal = {
          state: "text" /* TEXT */,
          tokens: [{
            type: 23 /* IMPORT_PATH */,
            parts: [path]
          }]
        };
        break;
      default:
        cursor.advance();
        path = `${path}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-import/lex-import.state.ts
function lexImport(cursor, _context) {
  let read = true;
  let importValue = "";
  let importStart = cursor.currentChar.index + 1;
  const retVal = {
    state: "import-path" /* IMPORT_PATH */,
    tokens: []
  };
  cursor.skipSpaces();
  cursor.advance();
  if (cursor.currentChar.code !== LEFT_BRACE) {
    throw "Expected { after @import";
  }
  while (read) {
    switch (cursor.peek()) {
      case SPACE:
        cursor.skipSpaces();
        if (importValue && cursor.peek() !== COMMA && cursor.peek() !== RIGHT_BRACE) {
          importValue = `${importValue} `;
        }
        break;
      case COMMA:
        addImport(retVal, cursor, importValue, importStart);
        importValue = "";
        importStart = cursor.currentChar.index + 1;
        break;
      case RIGHT_BRACE:
        addImport(retVal, cursor, importValue, importStart);
        read = false;
        break;
      default:
        cursor.advance();
        importValue = `${importValue}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}
function addImport(retVal, cursor, value, start) {
  const end = cursor.currentChar.index + 1;
  cursor.advance();
  retVal.tokens.push({
    type: 22 /* IMPORT */,
    parts: [value],
    span: {
      start,
      end
    }
  });
}

// ../packages/compiler/src/lexer/states/lex-interpolation-expression/lex-interpolation-expression.state.ts
function lexInterpolationExpression(cursor, context) {
  let read = true;
  let interpolation = "";
  let deep = 1;
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      case LEFT_BRACE:
        deep++;
        interpolation = addCharacter3(cursor, interpolation);
        break;
      case RIGHT_BRACE:
        deep--;
        if (deep === 0) {
          cursor.advance();
          interpolation = interpolation.trimEnd();
          const previousState = context.history.pop();
          let state;
          switch (previousState) {
            case "attribute" /* ATTRIBUTE */:
              if (cursor.peek() !== DOUBLE_QUOTE) {
                throw `Interpolation must end with double quotes '"', found '${String.fromCharCode(cursor.peek())}'`;
              }
              cursor.advance();
              state = resolveTagBodyState(context.history.at(-1));
              break;
            case "text" /* TEXT */:
            case "tag-body" /* TAG_BODY */:
              state = previousState;
              break;
            default:
              throw `Unexpected state '${previousState}' after interpolation expression`;
          }
          ;
          retVal = {
            state,
            tokens: [{
              type: 11 /* INTERPOLATION_EXPRESSION */,
              parts: [interpolation]
            }],
            popState: true
          };
          read = false;
        } else {
          interpolation = addCharacter3(cursor, interpolation);
        }
        break;
      default:
        interpolation = addCharacter3(cursor, interpolation);
    }
  }
  return retVal;
}
function addCharacter3(cursor, interpolation) {
  cursor.advance(1);
  return `${interpolation}${cursor.currentChar.value}`;
}

// ../packages/compiler/src/lexer/states/lex-interpolation-literal/lex-interpolation-literal.state.ts
function lexInterpolationliteral(cursor, context) {
  let read = true;
  let interpolation = "`";
  let retVal;
  cursor.advance();
  while (read) {
    switch (cursor.peek()) {
      case GRAVE_ACCENT:
        interpolation = addCharacter4(cursor, interpolation);
        if (cursor.peek() === RIGHT_BRACE) {
          cursor.advance();
          const previousState = context.history.pop();
          let state;
          switch (previousState) {
            case "attribute" /* ATTRIBUTE */:
              if (cursor.peek() !== DOUBLE_QUOTE) {
                throw `Attribute interpolation expression must end with double quotes '"', found '${String.fromCharCode(cursor.peek())}'`;
              }
              cursor.advance();
              state = resolveTagBodyState(context.history.at(-1));
              break;
            case "text" /* TEXT */:
            case "tag-body" /* TAG_BODY */:
              state = previousState;
              break;
            default:
              throw `Unexpected state '${previousState}' after interpolation literal`;
          }
          ;
          retVal = {
            state,
            tokens: [{
              type: 10 /* INTERPOLATION_LITERAL */,
              parts: [interpolation]
            }],
            popState: true
          };
          read = false;
        } else {
          interpolation = `${interpolation}${cursor.currentChar.value}`;
        }
        break;
      default:
        interpolation = addCharacter4(cursor, interpolation);
    }
  }
  return retVal;
}
function addCharacter4(cursor, interpolation) {
  cursor.advance();
  return `${interpolation}${cursor.currentChar.value}`;
}

// ../packages/compiler/src/lexer/states/lex-interpolation/lex-interpolation.state.ts
function lexInterpolation(cursor, _context) {
  cursor.advance();
  cursor.skipSpaces();
  return cursor.peek() === GRAVE_ACCENT ? { state: "interpolation-literal" /* INTERPOLATION_LITERAL */ } : { state: "interpolation-expression" /* INTERPOLATION_EXPRESSION */ };
}

// ../packages/compiler/src/lexer/states/lex-tag-body/lex-tag-body.state.ts
function lexTagBody(cursor, _context) {
  let read = true;
  let retVal;
  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        let state;
        if (isConditionalBindingKeyword(cursor)) {
          state = "flow-control" /* FLOW_CONTROL */;
        } else if (cursor.peekMatch("@@")) {
          state = "directive" /* DIRECTIVE */;
          cursor.advance(2);
        } else {
          throw `'@' must start a conditional binding (@if, @else, @switch, @case, @default) or a directive (@@selector): events are bound with (eventName)="handler()"`;
        }
        retVal = {
          state
        };
        read = false;
        break;
      case STAR:
        cursor.advance();
        retVal = {
          state: "structural-directive" /* STRUCTURAL_DIRECTIVE */
        };
        read = false;
        break;
      // A tag can span multiple lines: tabs and line breaks separate its bindings exactly like spaces
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.skipSpaces();
        break;
      case GREATER_THEN:
      case SLASH:
        retVal = {
          state: "tag-open-end" /* TAG_OPEN_END */,
          popState: true
        };
        read = false;
        break;
      case LPAREN:
        retVal = {
          state: "event" /* EVENT */
        };
        read = false;
        break;
      default:
        retVal = {
          state: "attribute" /* ATTRIBUTE */
        };
        read = false;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-tag-close/lex-tag-close.state.ts
function lexTagClose(cursor, _context) {
  let read = true;
  let tagName = "";
  let retVal;
  cursor.advance(2);
  cursor.skipSpaces();
  while (read) {
    switch (cursor.peek()) {
      case GREATER_THEN:
        if (!tagName) {
          throw "Tag close name cannot be empty";
        }
        cursor.advance();
        retVal = {
          state: "text" /* TEXT */,
          tokens: [{
            type: 4 /* TAG_CLOSE_NAME */,
            parts: [tagName]
          }]
        };
        read = false;
        break;
      // Tabs and line breaks are no more part of the name than spaces are
      case SPACE:
      case TAB:
      case LF:
      case CR:
        throw "Tag close name cannot contain spaces";
      default:
        cursor.advance();
        tagName = `${tagName}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-tag-open-end/lex-tag-open-end.state.ts
function lexTagOpenEnd(cursor, _context) {
  let retVal;
  if (cursor.peek() === GREATER_THEN) {
    cursor.advance();
    retVal = {
      state: "text" /* TEXT */,
      tokens: [{
        type: 3 /* TAG_OPEN_END */,
        parts: []
      }]
    };
  } else {
    cursor.advance();
    const nextChar = cursor.peek();
    if (nextChar === GREATER_THEN) {
      cursor.advance();
      retVal = {
        state: "text" /* TEXT */,
        tokens: [{
          type: 2 /* TAG_SELF_CLOSE */,
          parts: []
        }]
      };
    } else {
      throw `Unexpected character '${String.fromCharCode(nextChar)}' after '/': expected '>' to close self-closing tag`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/states/lex-tag-open-name/lex-tag-open-name.state.ts
function lexTagOpenName(cursor, _context) {
  let read = true;
  let tagName = "";
  let retVal;
  cursor.advance();
  cursor.skipSpaces();
  while (read) {
    switch (cursor.peek()) {
      case SPACE:
      case TAB:
      case LF:
      case CR:
      case SLASH:
      case GREATER_THEN:
        if (!tagName) {
          throw "Tag name cannot be empty ";
        }
        retVal = {
          state: "tag-body" /* TAG_BODY */,
          tokens: [{
            type: 1 /* TAG_OPEN_NAME */,
            parts: [tagName]
          }],
          pushState: true
        };
        read = false;
        break;
      default:
        cursor.advance();
        tagName = `${tagName}${cursor.currentChar.value}`;
    }
  }
  return retVal;
}

// ../packages/compiler/src/lexer/utils/chars/chars.utils.ts
function isNotBlank(str) {
  return /\S/.test(str);
}

// ../packages/compiler/src/costants/comment.costants.ts
var COMMENT_START = "<!--";

// ../packages/compiler/src/models/cursor/cursor.ts
var Cursor = class {
  /**
   * @param input - The full source text to operate on.
   */
  constructor(input) {
    this.input = input;
  }
  /**
   * Converts an absolute character offset in the text into a human-readable
   * line/column position.
   *
   * Uses binary search over the array of line-start offsets to quickly find
   * the line containing the given offset, then derives the column as the
   * difference between the offset and the start of that line.
   *
   * @param pos - Absolute (0-based) character offset in the original text.
   * @returns A formatted string in the form `[Ln <line>, Col <column>]`
   *          (line and column are 0-based).
   *
   * @example
   * ```typescript
   * cursor.getPositionFromCharacterIndex(15); // "[Ln 2, Col 3]"
   * ```
   */
  getPositionFromCharacterIndex(pos) {
    const lineStarts = this.getLineStarts();
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (lineStarts[mid] <= pos) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    const row = low;
    const column = pos - lineStarts[row];
    return `[Ln ${row + 1}, Col ${column + 1}]`;
  }
  /**
   * Computes the offset (into `input`) at which each line begins.
   *
   * The result always starts with `0` (the first line always begins at
   * offset 0), followed by the offset immediately after every `\n`
   * encountered in the text.
   *
   * @returns An array of absolute offsets, one per line, in ascending order.
   */
  getLineStarts() {
    const result = [0];
    const input = this.input;
    for (let i2 = 0; i2 < input.length; i2++) {
      if (input[i2] === "\n") {
        result.push(i2 + 1);
      }
    }
    return result;
  }
};

// ../packages/compiler/src/lexer/types/lexer-cursor/lexer-cursor.model.ts
var endOfFile = /* @__PURE__ */ Symbol("endOfFile");
var LexerCursor = class extends Cursor {
  /**
   * Representation of the current character.
   *
   * - `index`: absolute index within the input string
   * - `code`: Unicode code point of the character
   * - `value`: actual character value
   *
   * An index of `-1` indicates that the cursor has not yet consumed
   * any character or has reached EOF.
   */
  _currentChar = {
    code: 0,
    index: -1,
    value: ""
  };
  /**
   * Returns a read-only snapshot of the current character.
   */
  get currentChar() {
    return this._currentChar;
  }
  /**
   * Cache used by peek operations to avoid re-reading
   * the same character positions multiple times.
   *
   * Key: absolute character index
   * Value: Unicode code point
   */
  _peekCache = /* @__PURE__ */ new Map();
  /**
   * Flag indicating whether the cursor is currently consuming a comment block.
   */
  consumingComment = false;
  /**
   * Creates a new cursor for the given input source.
   *
   * @param input - Full source string to be tokenised.
   */
  constructor(input) {
    super(input);
  }
  /**
   * Advances the cursor by the specified number of characters.
   *
   * This method:
   * - Updates the current character
   * - Updates row/column position
   * - Detects line breaks (LF / CR)
   * - Throws an EOF error when the end of the input is reached
   *
   * @param chars - Number of characters to consume. Must be >= 1.
   * @throws When `chars` is less than 1 or when advancing past the end of the input.
   */
  advance(chars = 1) {
    if (chars < 1) {
      throw `${chars} is not a valid value. Please enter a number equal or greater than 1`;
    }
    const newIndex = this._currentChar.index + chars;
    if (newIndex >= this.input.length) {
      this._currentChar.code = EOF;
      this._currentChar.index = -1;
      this._currentChar.value = "";
      this.throwEOFError();
    } else {
      for (let i2 = this._currentChar.index + 1; i2 <= newIndex; i2++) {
        this._peekCache.delete(i2);
      }
      this._currentChar.index = newIndex;
      this._currentChar.value = this.input[newIndex];
      this._currentChar.code = this.input.charCodeAt(newIndex);
    }
  }
  peekMatch(pattern, length) {
    if (typeof pattern === "string") {
      const peekedChars = this.peek(pattern.length);
      for (let i2 = 0; i2 < pattern.length; i2++) {
        if (peekedChars[i2] !== pattern.charCodeAt(i2)) {
          return false;
        }
      }
      return true;
    }
    const start = this._currentChar.index + 1;
    const slicedInput = slice(this.input, start, start + length);
    return pattern.test(slicedInput);
  }
  peek(charsOrOptions, options) {
    this.consumeComment();
    const cache = this._peekCache;
    const chars = typeof charsOrOptions === "number" ? charsOrOptions : 1;
    const offset = (typeof charsOrOptions === "object" ? charsOrOptions : options)?.offset ?? 0;
    const result = chars === 1 ? this.peekOneChar(this._currentChar.index + offset + 1, cache) : this.peekMany(chars + offset, cache);
    return result;
  }
  /**
   * Skips all consecutive whitespace characters (spaces, tabs and line breaks) from the current position.
   */
  skipSpaces() {
    while (this.peek() === SPACE || this.peek() === TAB || this.peek() === LF || this.peek() === CR) {
      this.advance();
    }
  }
  /**
   * Peeks multiple characters ahead.
   */
  peekMany(chars, cache) {
    const peekedChars = new Array();
    const nextCharIndex = this._currentChar.index + 1;
    for (let i2 = nextCharIndex; i2 < nextCharIndex + chars; i2++) {
      peekedChars.push(this.peekOneChar(i2, cache));
    }
    return peekedChars;
  }
  /**
   * Peeks a single character at the given absolute index.
   */
  peekOneChar(index, cache) {
    if (cache.has(index)) {
      return cache.get(index);
    }
    if (index >= this.input.length) {
      this.throwEOFError();
    }
    const charCode = this.input.charCodeAt(index);
    cache.set(index, charCode);
    return charCode;
  }
  consumeComment() {
    if (!this.consumingComment && this.currentChar.index < this.input.length - 7) {
      this.consumingComment = true;
      if (this.peekMatch(COMMENT_START)) {
        this.advance(4);
        while (!this.peekMatch("-->") && this.currentChar.index < this.input.length - 3) {
          this.advance();
        }
        this.advance(3);
        this.consumingComment = false;
      } else {
        this.consumingComment = false;
      }
    }
  }
  /**
   * Throws a standardized EOF error used by the lexer engine
   * to terminate tokenization.
   */
  throwEOFError() {
    throw new Error("", { cause: endOfFile });
  }
};

// ../packages/compiler/src/lexer/states/lex-text/lex-text.state.ts
function lexText(cursor, context) {
  let read = true;
  let text = "";
  let retVal;
  try {
    while (read) {
      switch (cursor.peek()) {
        case LESS_THAN:
          const nextState = cursor.peek(1, { offset: 1 }) === SLASH ? "tag-close" /* TAG_CLOSE */ : "tag-open-name" /* TAG_OPEN_NAME */;
          retVal = { state: nextState };
          read = false;
          break;
        case LEFT_BRACE:
          retVal = {
            state: "interpolation" /* INTERPOLATION */,
            pushState: true
          };
          read = false;
          break;
        case AT_SIGN:
          retVal = {
            state: "flow-control" /* FLOW_CONTROL */
          };
          read = false;
          break;
        case RIGHT_BRACE:
          if (context.history[context.history.length - 1] === "flow-control-block" /* FLOW_CONTROL_BLOCK */) {
            cursor.advance();
            const tokens = new Array();
            if (isNotBlank(text)) {
              tokens.push({ type: 0 /* TEXT */, parts: [text] });
            }
            tokens.push({ type: 21 /* BLOCK_CLOSE */ });
            retVal = {
              state: "text" /* TEXT */,
              tokens,
              popState: true
            };
            read = false;
          } else {
            cursor.advance();
            text = `${text}${cursor.currentChar.value}`;
          }
          break;
        case LF:
        case CR:
          cursor.advance();
          break;
        default:
          cursor.advance();
          text = `${text}${cursor.currentChar.value}`;
      }
    }
  } catch (err) {
    if (text && err instanceof Error && err.cause === endOfFile) {
      retVal = {
        state: "text" /* TEXT */
      };
    } else {
      throw err;
    }
  }
  retVal.tokens ??= isNotBlank(text) ? [{ type: 0 /* TEXT */, parts: [text] }] : void 0;
  return retVal;
}

// ../packages/compiler/src/lexer/lexer/lexer.ts
var Lexer = class {
  /**
   * Creates a new Lexer instance for the given template content.
   *
   * @param _input - The full template text to tokenise.
   */
  constructor(_input) {
    this._input = _input;
    this._cursor = new LexerCursor(this._input);
  }
  /**
   * Cursor for navigating the input character stream.
   */
  _cursor;
  /**
   * Current lexer state.
   */
  _state = "text" /* TEXT */;
  /**
   * State stack used to support nested states (e.g. interpolations).
   */
  _stack = new Stack();
  /**
   * Accumulated list of tokens emitted during tokenization.
   */
  _tokens = new Array();
  /**
   * Maps each lexer state to its corresponding transition function.
   */
  _states = {
    ["text" /* TEXT */]: lexText,
    ["tag-open-name" /* TAG_OPEN_NAME */]: lexTagOpenName,
    ["tag-body" /* TAG_BODY */]: lexTagBody,
    ["tag-open-end" /* TAG_OPEN_END */]: lexTagOpenEnd,
    ["tag-close" /* TAG_CLOSE */]: lexTagClose,
    ["attribute" /* ATTRIBUTE */]: lexAttribute,
    ["attribute-value" /* ATTRIBUTE_VALUE */]: lexAttributeValue,
    ["event" /* EVENT */]: lexEvent,
    ["event-handler" /* EVENT_HANDLER */]: lexEventHandler,
    ["parameter" /* EVENT_PARAMETER */]: lexEventParameter,
    ["flow-control" /* FLOW_CONTROL */]: lexFlowControl,
    ["flow-control-condition" /* FLOW_CONTROL_CONDITION */]: lexDefaultFlowControlCondition,
    ["case-flow-control-condition" /* CASE_FLOW_CONTROL_CONDITION */]: lexCaseFlowControlCondition,
    ["flow-control-block" /* FLOW_CONTROL_BLOCK */]: lexFlowControlBlock,
    ["interpolation" /* INTERPOLATION */]: lexInterpolation,
    ["interpolation-expression" /* INTERPOLATION_EXPRESSION */]: lexInterpolationExpression,
    ["interpolation-literal" /* INTERPOLATION_LITERAL */]: lexInterpolationliteral,
    ["import" /* IMPORT */]: lexImport,
    ["import-path" /* IMPORT_PATH */]: lexImportPath,
    ["conditional-binding-body" /* CONDITIONAL_BINDING_BODY */]: lexConditionalBindingBody,
    ["directive" /* DIRECTIVE */]: lexDirective,
    ["directive-body" /* DIRECTIVE_BODY */]: lexDirectiveBody,
    ["structural-directive" /* STRUCTURAL_DIRECTIVE */]: lexStructuralDirective
  };
  /**
   * Runs the lexer over the input string and returns the full token array.
   * Drives the state machine until EOF is reached.
   *
   * @returns Array of all tokens produced from the input.
   */
  tokenize() {
    let eof = false;
    const cursor = this._cursor;
    let stateStartIndex = -1;
    while (!eof) {
      try {
        stateStartIndex = cursor.currentChar.index + 1;
        const transitionFunction = this._states[this._state];
        const { state, tokens, popState, pushState } = transitionFunction(cursor, {
          history: this._stack.values,
          tokens: [...this._tokens]
        });
        if (tokens?.length) {
          const stateEndIndex = cursor.currentChar.index + 1;
          this._tokens.push(...this.withTokenSpans(tokens, { start: stateStartIndex, end: stateEndIndex }));
        }
        if (pushState) {
          this._stack.push(this._state);
        }
        if (popState) {
          this._stack.pop();
        }
        this._state = state;
      } catch (err) {
        const isError = err instanceof Error;
        if (isError && err.cause === endOfFile) {
          eof = true;
        } else {
          const neighbourhood = 15;
          let startInterval = stateStartIndex;
          let i2 = stateStartIndex;
          let stop = false;
          while (!stop && i2 > 0) {
            const charCode = this._input.charCodeAt(i2);
            if (charCode === LF || charCode === CR || startInterval - i2 > neighbourhood && charCode === SPACE) {
              startInterval = i2 + 1;
              stop = true;
            } else {
              i2--;
            }
          }
          const currentIndex = cursor.currentChar.index;
          const stateEndIndex = currentIndex <= stateStartIndex ? currentIndex + 2 : currentIndex + 1;
          let endInterval = stateEndIndex;
          i2 = endInterval;
          stop = false;
          while (!stop && i2 < this._input.length) {
            const charCode = this._input.charCodeAt(i2);
            if (charCode === LF || charCode === CR || i2 - endInterval > neighbourhood && charCode === SPACE) {
              endInterval = i2 - 1;
              stop = true;
            } else {
              i2++;
            }
          }
          const previousNeighbourhood = slice(this._input, startInterval, stateStartIndex).replace(/^\s+/, "");
          const underlinedError = `\x1B[4m${slice(this._input, stateStartIndex, stateEndIndex)}\x1B[0m`;
          const nextNeighbourhood = slice(this._input, stateEndIndex, endInterval).replace(/\s+$/, "");
          const message = isError ? err.message : err;
          throw `[Lexer] ${cursor.getPositionFromCharacterIndex(stateEndIndex + 1)} - ${message}
 ---> ${previousNeighbourhood}${underlinedError}${nextNeighbourhood}`;
        }
      }
    }
    return this._tokens;
  }
  /**
   * Ensures every emitted token has a source span.
   *
   * States can provide a more accurate `token.span` (e.g. Event Parameter and Import States)
   * otherwise the lexer falls back to the full state-consumption range.
   */
  withTokenSpans(tokens, fallbackSpan) {
    return tokens.map((token) => ({
      ...token,
      span: token.span ?? fallbackSpan
    }));
  }
};

// ../packages/compiler/src/parser/models/parser-cursor/parser-cursor.model.ts
var ParserCursor = class extends Cursor {
  /**
   * Creates a new ParserCursor for the given token array.
   *
   * @param input - The full source text to operate on. 
   * @param _tokens - The array of tokens to navigate.
   */
  constructor(input, _tokens) {
    super(input);
    this._tokens = _tokens;
  }
  /**
   * Representation of the current token.
   *
   * - `index`: absolute index within the token array
   * - `value`: current token object (or EOF token)
   *
   * An index of `-1` indicates that the cursor has not
   * yet consumed any token or has reached EOF.
   */
  _currentToken = {
    value: { type: 27 /* EOF */ },
    index: -1
  };
  /**
   * Returns a read-only snapshot of the current token.
   */
  getCurrentToken() {
    return this._currentToken;
  }
  /**
   * Advances the cursor by the specified number of tokens.
   *
   * Updates the current token and its index.
   *
   * @param chars - Number of tokens to advance. Must be >= 1.
   * @throws When `chars` is less than 1.
   */
  advance(chars = 1) {
    if (chars < 1) {
      throw `${chars} is not a valid value. Please enter a number equal or greater than 1`;
    }
    const newIndex = this._currentToken.index + chars;
    if (newIndex >= this._tokens.length) {
      this._currentToken.value = { type: 27 /* EOF */ };
      this._currentToken.index = -1;
    } else {
      this._currentToken.index = newIndex;
      this._currentToken.value = this._tokens[newIndex];
    }
  }
  peek(charsOrOptions, options) {
    const tokens = typeof charsOrOptions === "number" ? charsOrOptions : 1;
    const offset = (typeof charsOrOptions === "object" ? charsOrOptions : options)?.offset ?? 0;
    return tokens === 1 ? this.peekOneToken(this._currentToken.index + offset + 1) : this.peekMany(tokens + offset);
  }
  /**
   * Peeks multiple tokens ahead.
   */
  peekMany(chars) {
    const peekedTokens = new Array();
    const nextTokenIndex = this._currentToken.index + 1;
    for (let i2 = nextTokenIndex; i2 < nextTokenIndex + chars; i2++) {
      peekedTokens.push(this.peekOneToken(i2));
    }
    return peekedTokens;
  }
  /**
   * Peeks a single token at the given absolute index.
   */
  peekOneToken(index) {
    return index < this._tokens.length ? this._tokens[index] : { type: 27 /* EOF */ };
  }
};

// ../packages/compiler/src/parser/utils/expression-validator/expression-validator.ts
var import_typescript4 = require("typescript");
function validateExpression(source) {
  const prefix = "const x = ";
  const sourceFile = (0, import_typescript4.createSourceFile)("expression.ts", `${prefix}${source}`, import_typescript4.ScriptTarget.ESNext, true);
  const statement = sourceFile.statements[0];
  const expression = statement.declarationList.declarations[0].initializer;
  const scanner = (0, import_typescript4.createScanner)(import_typescript4.ScriptTarget.ESNext, true, import_typescript4.LanguageVariant.Standard, sourceFile.text, void 0, expression.end);
  if (scanner.scan() !== import_typescript4.SyntaxKind.EndOfFileToken) {
    throw `'${source.trim()}' must be a single expression, got '${slice(sourceFile.text, expression.end).trim()}' after '${expression.getText()}'.`;
  }
  visitNode(expression);
  return {
    node: expression
  };
}
function visitNode(node) {
  if (!isAllowedNode(node)) {
    throw buildDisallowedMessage(node);
  }
  (0, import_typescript4.forEachChild)(node, visitNode);
}
function isAllowedNode(node) {
  switch (node.kind) {
    // ---- Literals ----
    case import_typescript4.SyntaxKind.StringLiteral:
    case import_typescript4.SyntaxKind.NumericLiteral:
    case import_typescript4.SyntaxKind.BigIntLiteral:
    case import_typescript4.SyntaxKind.TrueKeyword:
    case import_typescript4.SyntaxKind.FalseKeyword:
    case import_typescript4.SyntaxKind.NullKeyword:
    case import_typescript4.SyntaxKind.UndefinedKeyword:
    // ---- Identifiers ----
    case import_typescript4.SyntaxKind.Identifier:
    // ---- Member access ----
    // user.name
    case import_typescript4.SyntaxKind.PropertyAccessExpression:
    // user['name'], items[0]
    case import_typescript4.SyntaxKind.ElementAccessExpression:
    // ---- Call expressions ----
    // user.getFullName(), user.hasRole('admin')
    case import_typescript4.SyntaxKind.CallExpression:
    // ---- Binary expressions ----
    // Covers arithmetic, comparison, logical, bitwise, nullish coalescing,
    // and instanceof. Assignment operators are rejected in visitNode via
    // buildDisallowedMessage before recursing into children.
    case import_typescript4.SyntaxKind.BinaryExpression:
    // ---- Operator tokens — visited as children of BinaryExpression ----
    // Comparison
    case import_typescript4.SyntaxKind.EqualsEqualsToken:
    // ==
    case import_typescript4.SyntaxKind.EqualsEqualsEqualsToken:
    // ===
    case import_typescript4.SyntaxKind.ExclamationEqualsToken:
    // !=
    case import_typescript4.SyntaxKind.ExclamationEqualsEqualsToken:
    // !==
    case import_typescript4.SyntaxKind.LessThanToken:
    // 
    case import_typescript4.SyntaxKind.LessThanEqualsToken:
    // <=
    case import_typescript4.SyntaxKind.GreaterThanToken:
    // >
    case import_typescript4.SyntaxKind.GreaterThanEqualsToken:
    // >=
    // Arithmetic
    case import_typescript4.SyntaxKind.PlusToken:
    // +
    case import_typescript4.SyntaxKind.MinusToken:
    // -
    case import_typescript4.SyntaxKind.AsteriskToken:
    // *
    case import_typescript4.SyntaxKind.SlashToken:
    // /
    case import_typescript4.SyntaxKind.PercentToken:
    // %
    case import_typescript4.SyntaxKind.AsteriskAsteriskToken:
    // **
    // Logical
    case import_typescript4.SyntaxKind.AmpersandAmpersandToken:
    // &&
    case import_typescript4.SyntaxKind.BarBarToken:
    // ||
    case import_typescript4.SyntaxKind.QuestionQuestionToken:
    // ??
    case import_typescript4.SyntaxKind.QuestionDotToken:
    // ?.
    case import_typescript4.SyntaxKind.QuestionToken:
    // ?
    case import_typescript4.SyntaxKind.ColonToken:
    // :
    // Bitwise
    case import_typescript4.SyntaxKind.AmpersandToken:
    // &
    case import_typescript4.SyntaxKind.BarToken:
    // |
    case import_typescript4.SyntaxKind.CaretToken:
    // ^
    case import_typescript4.SyntaxKind.LessThanLessThanToken:
    // 
    case import_typescript4.SyntaxKind.GreaterThanGreaterThanToken:
    // >>
    case import_typescript4.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
    // >>>
    // instanceof / in
    case import_typescript4.SyntaxKind.InstanceOfKeyword:
    // instanceof
    case import_typescript4.SyntaxKind.InKeyword:
    // in
    // ---- Unary expressions ----
    // !isAdmin, ~flags, +n, -n, typeof x, void 0
    case import_typescript4.SyntaxKind.PrefixUnaryExpression:
    case import_typescript4.SyntaxKind.PostfixUnaryExpression:
    // typeof is represented as a dedicated node kind in some TS versions
    case import_typescript4.SyntaxKind.TypeOfExpression:
    case import_typescript4.SyntaxKind.VoidExpression:
    // ---- Conditional (ternary) ----
    // isAdmin ? 'yes' : 'no'
    case import_typescript4.SyntaxKind.ConditionalExpression:
    // ---- Parenthesised expressions ----
    case import_typescript4.SyntaxKind.ParenthesizedExpression:
    // ---- Template literals ----
    // `Hello ${user.name}`
    case import_typescript4.SyntaxKind.TemplateExpression:
    case import_typescript4.SyntaxKind.NoSubstitutionTemplateLiteral:
    case import_typescript4.SyntaxKind.TemplateHead:
    case import_typescript4.SyntaxKind.TemplateMiddle:
    case import_typescript4.SyntaxKind.TemplateTail:
    case import_typescript4.SyntaxKind.TemplateSpan:
    // ---- Arrays ----
    // [1, 2, 3], [...items]
    case import_typescript4.SyntaxKind.ArrayLiteralExpression:
    // ---- Objects ----
    // { key: value }, { ...defaults, name }
    case import_typescript4.SyntaxKind.ObjectLiteralExpression:
    case import_typescript4.SyntaxKind.PropertyAssignment:
    case import_typescript4.SyntaxKind.ShorthandPropertyAssignment:
    // { ...obj } inside an object literal
    case import_typescript4.SyntaxKind.SpreadAssignment:
    // ---- Spread ----
    // foo(...args), [...items]
    case import_typescript4.SyntaxKind.SpreadElement:
    case import_typescript4.SyntaxKind.TaggedTemplateExpression:
    // ---- Internal structural nodes ----
    // Visited during recursion but carry no semantic meaning of their own.
    case import_typescript4.SyntaxKind.SyntaxList:
      return true;
    // ---- Disallowed by default ----
    default:
      return false;
  }
}
function buildDisallowedMessage(node) {
  switch (node.kind) {
    case import_typescript4.SyntaxKind.AwaitExpression:
      return "'await' is not allowed inside template expressions.";
    case import_typescript4.SyntaxKind.YieldExpression:
      return "'yield' is not allowed inside template expressions.";
    case import_typescript4.SyntaxKind.NewExpression:
      return "'new' is not allowed inside template expressions.";
    case import_typescript4.SyntaxKind.ArrowFunction:
    case import_typescript4.SyntaxKind.FunctionExpression:
      return "Function expressions are not allowed inside template expressions.";
    default:
      return `'${import_typescript4.SyntaxKind[node.kind]}' is not allowed inside template expressions.`;
  }
}

// ../packages/compiler/src/parser/states/parse-interpolation/parse-interpolation.state.ts
function parseInterpolation(cursor, _parseNode, token) {
  const startOffset = token.span.start;
  cursor.advance();
  return {
    type: 4 /* Interpolation */,
    expression: validateExpression(token.parts[0]).node,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}

// ../packages/compiler/src/parser/states/parse-attribute/parse-attribute.state.ts
function parseAttribute(cursor, parseNode, token) {
  const startOffset = token.span.start;
  cursor.advance();
  const name = token.parts[0];
  const nextToken = cursor.peek();
  if (isBooleanAttributeSuccessor(nextToken.type)) {
    return {
      type: 1 /* Attribute */,
      name,
      value: "true",
      span: {
        start: startOffset,
        end: cursor.getCurrentToken().value.span.end
      }
    };
  }
  if (nextToken.type === 11 /* INTERPOLATION_EXPRESSION */ || nextToken.type === 10 /* INTERPOLATION_LITERAL */) {
    const interpolation = parseInterpolation(cursor, parseNode, nextToken);
    return {
      type: 1 /* Attribute */,
      name,
      value: interpolation,
      span: {
        start: startOffset,
        end: cursor.getCurrentToken().value.span.end
      }
    };
  }
  if (nextToken.type !== 6 /* ATTRIBUTE_VALUE */) {
    throw `Attribute value missing for ${name} in: ${name}`;
  }
  cursor.advance();
  return {
    type: 1 /* Attribute */,
    name,
    value: nextToken.parts[0],
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}
function isBooleanAttributeSuccessor(type) {
  switch (type) {
    case 5 /* ATTRIBUTE */:
    case 4 /* TAG_CLOSE_NAME */:
    case 7 /* EVENT */:
    case 3 /* TAG_OPEN_END */:
    case 2 /* TAG_SELF_CLOSE */:
    case 12 /* IF */:
    case 15 /* ELSE_IF */:
    case 14 /* ELSE */:
    case 16 /* SWITCH */:
    case 17 /* CASE */:
    case 18 /* DEFAULT */:
    case 21 /* BLOCK_CLOSE */:
    case 24 /* DIRECTIVE */:
    case 25 /* DIRECTIVE_CLOSE */:
      return true;
    default:
      return false;
  }
}

// ../packages/compiler/src/parser/states/parse-event/parse-event.state.ts
function parseEvent(cursor, _parseNode, token) {
  const startOffset = token.span.start;
  cursor.advance();
  const name = token.parts[0];
  const handlerToken = cursor.peek();
  if (handlerToken.type !== 8 /* EVENT_HANDLER */) {
    throw `Invalid event format for ${name}`;
  }
  cursor.advance();
  let endOffset = cursor.getCurrentToken().value.span.end;
  const parameters = new Array();
  while (cursor.peek().type === 9 /* EVENT_PARAMETER */) {
    cursor.advance();
    parameters.push(validateExpression(cursor.getCurrentToken().value.parts[0]).node);
    endOffset = cursor.getCurrentToken().value.span.end;
  }
  return {
    type: 2 /* Event */,
    name,
    handler: handlerToken.parts[0],
    parameters,
    span: {
      start: startOffset,
      end: endOffset
    }
  };
}

// ../packages/compiler/src/parser/states/parse-directive/parse-directive.state.ts
function parseDirective(cursor, parseNode, token) {
  const startOffset = token.span.start;
  cursor.advance();
  const attributes = new Array();
  const events = new Array();
  const conditionalBindings = new Array();
  let read = true;
  while (read) {
    const token2 = cursor.peek();
    switch (token2.type) {
      case 5 /* ATTRIBUTE */:
        attributes.push(parseAttribute(cursor, parseNode, token2));
        break;
      case 7 /* EVENT */:
        events.push(parseEvent(cursor, parseNode, token2));
        break;
      case 12 /* IF */:
      case 16 /* SWITCH */:
        conditionalBindings.push(parseConditionalBinding(cursor, parseNode, token2));
        break;
      case 25 /* DIRECTIVE_CLOSE */:
        cursor.advance();
        read = false;
        break;
      default:
        throw new Error("Unexpected token in directive");
    }
  }
  return {
    type: 15 /* Directive */,
    selector: token.parts[0],
    attributes,
    events,
    conditionalBindings,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}

// ../packages/compiler/src/parser/states/parse-structural-directive/parse-structural-directive.state.ts
function parseStructuralDirective(cursor, parseNode, token) {
  const startOffset = token.span.start;
  cursor.advance();
  const attributes = new Array();
  let read = true;
  while (read) {
    const token2 = cursor.peek();
    switch (token2.type) {
      case 5 /* ATTRIBUTE */:
        attributes.push(parseAttribute(cursor, parseNode, token2));
        break;
      case 25 /* DIRECTIVE_CLOSE */:
        cursor.advance();
        read = false;
        break;
      default:
        throw new Error("Unexpected token in structural directive");
    }
  }
  return {
    type: 16 /* StructuralDirective */,
    selector: token.parts[0],
    attributes,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}

// ../packages/compiler/src/parser/states/parse-conditional-binding/parse-conditional-binding.state.ts
function parseConditionalBinding(cursor, parseNode, token) {
  return token.type === 12 /* IF */ ? parseIfBinding(cursor, parseNode, token) : parseSwitchBinding(cursor, parseNode, token);
}
function parseIfBinding(cursor, parseNode, token) {
  const branches = new Array();
  let branchToken = token;
  do {
    cursor.advance();
    const condition = validateExpression(parseCondition(cursor, branchToken.type)).node;
    branches.push(parseBranch(cursor, parseNode, branchToken.span.start, condition));
    branchToken = cursor.peek();
  } while (branchToken.type === 15 /* ELSE_IF */);
  if (branchToken.type === 14 /* ELSE */) {
    cursor.advance();
    branches.push(parseBranch(cursor, parseNode, branchToken.span.start, null));
  }
  return {
    type: 12 /* IfBinding */,
    branches,
    span: {
      start: token.span.start,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}
function parseSwitchBinding(cursor, parseNode, token) {
  cursor.advance();
  const expression = validateExpression(parseCondition(cursor, token.type)).node;
  consumeBlockOpen(cursor);
  const branches = new Array();
  let read = true;
  while (read) {
    const branchToken = cursor.peek();
    switch (branchToken.type) {
      case 17 /* CASE */:
      case 18 /* DEFAULT */:
        if (branches.at(-1)?.condition === null) {
          throw new Error("@default must be the last branch of a @switch");
        }
        branches.push(parseBranch(cursor, parseNode, branchToken.span.start, parseCases(cursor)));
        break;
      case 21 /* BLOCK_CLOSE */:
        cursor.advance();
        read = false;
        break;
      default:
        throw new Error(`Unexpected ${TokenType[branchToken.type]} inside SWITCH, expected CASE or DEFAULT`);
    }
  }
  return {
    type: 13 /* SwitchBinding */,
    expression,
    branches,
    span: {
      start: token.span.start,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}
function parseCases(cursor) {
  if (cursor.peek().type === 18 /* DEFAULT */) {
    cursor.advance();
    return null;
  }
  const conditions = new Array();
  do {
    cursor.advance();
    conditions.push(parseCondition(cursor, 17 /* CASE */));
  } while (cursor.peek().type === 17 /* CASE */);
  return conditions;
}
function parseBranch(cursor, parseNode, start, condition) {
  consumeBlockOpen(cursor);
  const attributes = new Array();
  const events = new Array();
  const conditionalBindings = new Array();
  const directives = new Array();
  const structuralDirectives = new Array();
  let read = true;
  while (read) {
    const token = cursor.peek();
    switch (token.type) {
      case 5 /* ATTRIBUTE */:
        attributes.push(parseAttribute(cursor, parseNode, token));
        break;
      case 7 /* EVENT */:
        events.push(parseEvent(cursor, parseNode, token));
        break;
      case 12 /* IF */:
      case 16 /* SWITCH */:
        conditionalBindings.push(parseConditionalBinding(cursor, parseNode, token));
        break;
      case 24 /* DIRECTIVE */:
        directives.push(parseDirective(cursor, parseNode, token));
        break;
      case 26 /* STRUCTURAL_DIRECTIVE */:
        structuralDirectives.push(parseStructuralDirective(cursor, parseNode, token));
        break;
      case 21 /* BLOCK_CLOSE */:
        cursor.advance();
        read = false;
        break;
      default:
        throw new Error(`Unexpected ${TokenType[token.type]} in conditional binding`);
    }
  }
  return {
    type: 14 /* ConditionalBindingBranch */,
    condition,
    attributes,
    events,
    conditionalBindings,
    directives,
    structuralDirectives,
    span: {
      start,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}
function parseCondition(cursor, keyword) {
  const token = cursor.peek();
  if (token.type !== 19 /* CONDITION */) {
    throw new Error(`Expected CONDITION after ${TokenType[keyword]}, got ${TokenType[token.type]}`);
  }
  cursor.advance();
  return token.parts[0];
}
function consumeBlockOpen(cursor) {
  const token = cursor.peek();
  if (token.type !== 20 /* BLOCK_OPEN */) {
    throw new Error(`Expected BLOCK_OPEN, got ${TokenType[token.type]}`);
  }
  cursor.advance();
}

// ../packages/compiler/src/parser/states/parse-element/parse-element.state.ts
function parseElement(cursor, parseNode, token) {
  cursor.advance();
  const tagName = token.parts[0];
  const attributes = new Array();
  const events = new Array();
  const conditionalBindings = new Array();
  const directives = new Array();
  const structuralDirectives = new Array();
  let read = true;
  while (read) {
    const token2 = cursor.peek();
    switch (token2.type) {
      case 5 /* ATTRIBUTE */:
        attributes.push(parseAttribute(cursor, parseNode, token2));
        break;
      case 7 /* EVENT */:
        events.push(parseEvent(cursor, parseNode, token2));
        break;
      case 12 /* IF */:
      case 16 /* SWITCH */:
        conditionalBindings.push(parseConditionalBinding(cursor, parseNode, token2));
        break;
      case 24 /* DIRECTIVE */:
        directives.push(parseDirective(cursor, parseNode, token2));
        break;
      case 26 /* STRUCTURAL_DIRECTIVE */:
        structuralDirectives.push(parseStructuralDirective(cursor, parseNode, token2));
        break;
      default:
        read = false;
    }
  }
  assertUniqueAttributes(attributes, conditionalBindings, (name) => `Attribute "${name}" is bound more than once on <${tagName}>`);
  assertUniqueDirectives(tagName, directives, conditionalBindings, (branch) => branch.directives);
  assertUniqueDirectives(tagName, structuralDirectives, conditionalBindings, (branch) => branch.structuralDirectives);
  const peekedTokenType = cursor.peek().type;
  switch (peekedTokenType) {
    // Consume TAG_OPEN_END if present: <div>
    case 3 /* TAG_OPEN_END */:
      cursor.advance();
      break;
    // Handle self-closing tags: <div />
    case 2 /* TAG_SELF_CLOSE */:
      cursor.advance();
      return {
        type: 0 /* Element */,
        tagName,
        attributes,
        events,
        children: [],
        conditionalBindings,
        directives,
        structuralDirectives
      };
    default:
      throw new Error(`Unexpected token ${TokenType[peekedTokenType]}`);
  }
  const children = new Array();
  while (!isTagClose(cursor, tagName)) {
    const child = parseNode();
    if (child) {
      children.push(child);
    }
  }
  cursor.advance();
  return {
    type: 0 /* Element */,
    tagName,
    attributes,
    events,
    children,
    conditionalBindings,
    directives,
    structuralDirectives
  };
}
function assertUniqueAttributes(attributes, conditionalBindings, describeDuplicate, bound = /* @__PURE__ */ new Set()) {
  for (let i2 = 0; i2 < attributes.length; i2++) {
    const { name, span } = attributes[i2];
    if (bound.has(name)) {
      throw new Error(describeDuplicate(name), { cause: span });
    }
    bound.add(name);
  }
  assertUniqueInBranches(conditionalBindings, bound, (branch, boundInBranch) => assertUniqueAttributes(branch.attributes, branch.conditionalBindings, describeDuplicate, boundInBranch));
}
function assertUniqueDirectives(tagName, directives, conditionalBindings, getDirectives, applied = /* @__PURE__ */ new Set()) {
  for (let i2 = 0; i2 < directives.length; i2++) {
    const directive = directives[i2];
    const { selector, attributes, span, type } = directive;
    const [kind, property] = type === 15 /* Directive */ ? ["Directive", "directive"] : ["Structural directive", "structural directive"];
    if (applied.has(selector)) {
      throw new Error(`${kind} "${selector}" is applied more than once on <${tagName}>`, { cause: span });
    }
    applied.add(selector);
    assertUniqueAttributes(attributes, type === 15 /* Directive */ ? directive.conditionalBindings : [], (name) => `Property "${name}" of ${property} "${selector}" is bound more than once on <${tagName}>`);
  }
  assertUniqueInBranches(conditionalBindings, applied, (branch, appliedInBranch) => assertUniqueDirectives(tagName, getDirectives(branch), branch.conditionalBindings, getDirectives, appliedInBranch));
}
function assertUniqueInBranches(conditionalBindings, declared, assertUnique) {
  for (let i2 = 0; i2 < conditionalBindings.length; i2++) {
    const { branches } = conditionalBindings[i2];
    const declaredInBranches = /* @__PURE__ */ new Set();
    for (let j = 0; j < branches.length; j++) {
      const declaredInBranch = new Set(declared);
      assertUnique(branches[j], declaredInBranch);
      declaredInBranch.forEach((name) => declaredInBranches.add(name));
    }
    declaredInBranches.forEach((name) => declared.add(name));
  }
}
function isTagClose(cursor, tagName) {
  const nextToken = cursor.peek();
  switch (nextToken.type) {
    case 27 /* EOF */:
      throw new Error(`Expected closing tag ${tagName} while file is over`);
    case 4 /* TAG_CLOSE_NAME */:
      const tokenTagName = nextToken.parts[0];
      if (tokenTagName === tagName) {
        return true;
      } else {
        throw `Expected closing tag ${tagName}, found ${tokenTagName}`;
      }
    default:
      return false;
  }
}

// ../packages/compiler/src/parser/states/parse-for/parse-for.state.ts
var import_typescript5 = require("typescript");

// ../packages/compiler/src/parser/states/parse-block-children/parse-block-children.state.ts
function parseBlockChildren(cursor, parseNode) {
  const children = new Array();
  while (cursor.peek().type !== 21 /* BLOCK_CLOSE */) {
    if (cursor.peek().type === 27 /* EOF */) {
      throw "Unexpected end of template: expected BLOCK_CLOSE";
    }
    const child = parseNode();
    if (child) {
      children.push(child);
    }
  }
  cursor.advance();
  return children;
}

// ../packages/compiler/src/parser/states/parse-for/parse-for.state.ts
function parseForControlFlow(cursor, parseNode, _token) {
  cursor.advance();
  const conditionToken = cursor.peek();
  if (conditionToken.type !== 19 /* CONDITION */) {
    throw `Expected CONDITION after FOR, got ${TokenType[conditionToken.type]}`;
  }
  const expression = parseForExpression(conditionToken.parts[0]);
  cursor.advance(2);
  const children = parseBlockChildren(cursor, parseNode);
  return { type: 8 /* For */, ...expression, children };
}
function parseForExpression(source) {
  const sections = splitForSections(source);
  if (sections.length < 1) {
    throw '@for requires at least one of these forms: "item of items()" or "numberItems()".';
  }
  const iterSection = sections[0].trim();
  const ofIndex = iterSection.indexOf(" of ");
  let itemAlias;
  let iterableSource = iterSection;
  if (ofIndex !== -1) {
    itemAlias = slice(iterSection, 0, ofIndex).trim();
    iterableSource = slice(iterSection, ofIndex + 4).trim();
    if (!isValidIdentifier(itemAlias)) {
      throw `'${itemAlias}' is not a valid item alias.`;
    }
  }
  const iterValidation = validateExpression(iterableSource);
  const implicitAliases = /* @__PURE__ */ new Map();
  if (sections.length >= 3 && sections[2] !== void 0) {
    const aliasSection = sections[2].trim();
    parseImplicitAliases(aliasSection, implicitAliases);
  }
  const trackSection = sections[1]?.trim();
  let trackSource = itemAlias ?? implicitAliases.get("$index") ?? "$index";
  if (trackSection) {
    if (!trackSection.startsWith("track ")) {
      throw 'Second section of @for must start with "track".';
    }
    trackSource = slice(trackSection, 6).trim();
  }
  const trackValidation = validateExpression(trackSource);
  return {
    itemAlias,
    iterableExpression: iterValidation.node,
    iterableSource,
    trackExpression: trackValidation.node,
    trackSource,
    implicitAliases
  };
}
function parseImplicitAliases(source, out) {
  const entries = source.split(",");
  const IMPLICIT_VARIABLES = /* @__PURE__ */ new Set(["$index", "$last", "$first", "$even", "$odd"]);
  for (let i2 = 0; i2 < entries.length; i2++) {
    const entry = entries[i2];
    const trimmed = entry.trim();
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      throw `Invalid alias declaration '${trimmed}'. Expected '$implicit = alias'.`;
    }
    const isImplicitVariable = (value) => IMPLICIT_VARIABLES.has(value);
    const implicit = slice(trimmed, eqIndex + 1).trim();
    if (!isImplicitVariable(implicit)) {
      throw `'${implicit}' is not a known implicit variable. Known variables: ${[...IMPLICIT_VARIABLES].join(", ")}.`;
    }
    const alias = slice(trimmed, 0, eqIndex).trim();
    if (!isValidIdentifier(alias)) {
      throw `'${alias}' is not a valid alias identifier.`;
    }
    if (out.has(implicit)) {
      throw `'${implicit}' is already aliased in this @for expression.`;
    } else {
      out.set(implicit, alias);
    }
  }
}
function splitForSections(source) {
  const sections = new Array();
  let current = "";
  let depth = 0;
  let inString;
  for (let i2 = 0; i2 < source.length; i2++) {
    const char = source[i2];
    if (!current && char === " ") {
      continue;
    }
    if (inString) {
      current = `${current}${char}`;
      if (char === inString && source[i2 - 1] !== "\\") {
        inString = null;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      current = `${current}${char}`;
      continue;
    }
    if (char === "(" || char === "[" || char === "{") {
      depth++;
      current = `${current}${char}`;
      continue;
    }
    if (char === ")" || char === "]" || char === "}") {
      depth--;
      current = `${current}${char}`;
      continue;
    }
    if (char === ";" && depth === 0) {
      sections.push(current);
      current = "";
      continue;
    }
    current = `${current}${char}`;
  }
  if (current.trim().length) {
    sections.push(current);
  }
  return sections;
}
function isValidIdentifier(name) {
  if (!name.length) {
    return false;
  }
  const sourceFile = (0, import_typescript5.createSourceFile)("__id.ts", name, import_typescript5.ScriptTarget.ESNext, false);
  const statement = sourceFile.statements[0];
  return !!statement && (0, import_typescript5.isExpressionStatement)(statement) && (0, import_typescript5.isIdentifier)(statement.expression) && statement.expression.text === name;
}

// ../packages/compiler/src/parser/states/parse-if/parse-if.state.ts
function parseIfControlFlow(cursor, parseNode, token) {
  return parseIfOrElseIf(cursor, parseNode, token);
}
function parseElseIfRecursively(cursor, parseNode, token) {
  switch (token.type) {
    case 15 /* ELSE_IF */:
      return parseIfOrElseIf(cursor, parseNode, token);
    case 14 /* ELSE */:
      const startOffset = token.span.start;
      cursor.advance(2);
      const elseChildren = parseBlockChildren(cursor, parseNode);
      return {
        type: 6 /* Else */,
        children: elseChildren,
        span: {
          start: startOffset,
          end: cursor.getCurrentToken().value.span.end
        }
      };
  }
}
function parseIfOrElseIf(cursor, parseNode, token) {
  const startOffset = token.span.start;
  cursor.advance();
  const conditionToken = cursor.peek();
  if (conditionToken.type !== 19 /* CONDITION */) {
    throw `Expected CONDITION after ${TokenType[token.type]}, got ${TokenType[conditionToken.type]}`;
  }
  cursor.advance(2);
  const condition = conditionToken.parts[0];
  const validationResult = validateExpression(condition);
  const consequent = parseBlockChildren(cursor, parseNode);
  let alternate = null;
  const nextToken = cursor.peek();
  if (nextToken.type === 15 /* ELSE_IF */ || nextToken.type === 14 /* ELSE */) {
    alternate = parseElseIfRecursively(cursor, parseNode, nextToken);
  }
  return {
    type: token.type === 12 /* IF */ ? 5 /* If */ : 7 /* ElseIf */,
    condition,
    conditionNode: validationResult.node,
    children: consequent,
    alternate,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}

// ../packages/compiler/src/parser/states/parse-import/parse-import.state.ts
function parseImport(cursor, _parseNode, _token) {
  const specifiers = new Array();
  while (cursor.peek().type === 22 /* IMPORT */) {
    cursor.advance();
    const rawSpecifier = cursor.getCurrentToken().value.parts[0];
    const specifier = parseSpecifier(rawSpecifier);
    specifiers.push(specifier);
  }
  cursor.advance();
  return {
    type: 11 /* Import */,
    specifiers,
    path: cursor.getCurrentToken().value.parts[0]
  };
}
function parseSpecifier(raw) {
  const trimmed = raw.trim();
  const namespaceMatch = trimmed.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (namespaceMatch) {
    return {
      imported: "*",
      local: namespaceMatch[1]
    };
  }
  const defaultMatch = trimmed.match(/^default\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (defaultMatch) {
    return {
      imported: "default",
      local: defaultMatch[1]
    };
  }
  const namedMatch = trimmed.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
  if (namedMatch) {
    return {
      imported: namedMatch[1],
      local: namedMatch[2] ?? namedMatch[1]
    };
  }
  throw `Invalid import specifier "${raw}".`;
}

// ../packages/compiler/src/parser/states/parse-switch/parse-switch.state.ts
function parseSwitchControlFlow(cursor, parseNode, _token) {
  cursor.advance();
  const conditionToken = cursor.peek();
  if (conditionToken.type !== 19 /* CONDITION */) {
    throw `Expected CONDITION after SWITCH, got ${TokenType[conditionToken.type]}`;
  }
  const expression = validateExpression(conditionToken.parts[0]).node;
  cursor.advance(2);
  const cases = new Array();
  while (cursor.peek().type !== 21 /* BLOCK_CLOSE */) {
    const token = cursor.peek();
    switch (token.type) {
      case 17 /* CASE */:
        const caseStartOffset = token.span.start;
        const condition = new Array();
        do {
          cursor.advance();
          const caseCondition = cursor.peek();
          if (caseCondition.type !== 19 /* CONDITION */) {
            throw "Expected CONDITION after CASE";
          }
          condition.push(caseCondition.parts[0]);
          cursor.advance();
        } while (cursor.peek().type === 17 /* CASE */);
        if (cursor.peek().type !== 20 /* BLOCK_OPEN */) {
          throw "Expected BLOCK_OPEN after CASE condition";
        }
        cursor.advance();
        const caseChildren = parseBlockChildren(cursor, parseNode);
        cases.push({
          type: 10 /* Case */,
          condition,
          children: caseChildren,
          span: {
            start: caseStartOffset,
            end: cursor.getCurrentToken().value.span.end
          }
        });
        break;
      case 18 /* DEFAULT */:
        const defaultStartOffset = token.span.start;
        cursor.advance(2);
        const defaultChildren = parseBlockChildren(cursor, parseNode);
        cases.push({
          type: 10 /* Case */,
          condition: null,
          children: defaultChildren,
          span: {
            start: defaultStartOffset,
            end: cursor.getCurrentToken().value.span.end
          }
        });
        break;
      default:
        throw `Unexpected ${TokenType[token.type]} inside SWITCH, expected CASE or DEFAULT`;
    }
  }
  cursor.advance();
  return {
    type: 9 /* Switch */,
    expression,
    children: cases
  };
}

// ../packages/compiler/src/parser/states/parse-text/parse-text.state.ts
function parseText(cursor, _parseNode, token) {
  cursor.advance();
  return {
    type: 3 /* Text */,
    value: token.parts[0]
  };
}

// ../packages/compiler/src/parser/parser/parser.ts
var Parser = class {
  /**
   * Creates a new Parser instance.
   *
   * @param input - The full source text to operate on.
   * @param tokens - Array of tokens produced by the Lexer.
   */
  constructor(_input, tokens) {
    this._input = _input;
    this._cursor = new ParserCursor(this._input, tokens);
  }
  /**
   * Internal cursor for navigating tokens
   */
  _cursor;
  /**
   * Mapping of token types to their corresponding parser transition functions, 
   * which handle the logic for parsing each token type into AST nodes.
   */
  _states = {
    [0 /* TEXT */]: parseText,
    [11 /* INTERPOLATION_EXPRESSION */]: parseInterpolation,
    [10 /* INTERPOLATION_LITERAL */]: parseInterpolation,
    [1 /* TAG_OPEN_NAME */]: parseElement,
    [12 /* IF */]: parseIfControlFlow,
    [13 /* FOR */]: parseForControlFlow,
    [16 /* SWITCH */]: parseSwitchControlFlow,
    [22 /* IMPORT */]: parseImport
  };
  /**
   * In rare situations, parse node could be called recursively.
   * 
   */
  thrown = false;
  /**
   * Entry point for parsing the token stream into AST nodes.
   *
   * @returns Array of top-level AST nodes.
   */
  parse() {
    const nodes = new Array();
    while (this._cursor.peek().type !== 27 /* EOF */) {
      const parseNode = this.parseNode();
      if (parseNode) {
        nodes.push(parseNode);
      }
    }
    return nodes;
  }
  /**
   * Parses the next AST node based on the current token.
   *
   * @returns The parsed AST node, or `undefined` for EOF.
   * @throws When no transition function is registered for the current token type.
   */
  parseNode() {
    const token = this._cursor.peek();
    if (token.type === 27 /* EOF */) {
      return void 0;
    }
    const startOffset = token.span.start;
    try {
      const state = this._states[token.type];
      if (!state) {
        throw `No transition function for token of type ${TokenType[token.type]}`;
      }
      const node = state(this._cursor, this.parseNode.bind(this), token);
      const currentToken = this._cursor.getCurrentToken().value;
      const endOffset = "span" in currentToken ? currentToken.span.end : token.span.end;
      return {
        ...node,
        span: node.span ?? {
          start: startOffset,
          end: endOffset
        }
      };
    } catch (err) {
      if (this.thrown) {
        throw err;
      }
      this.thrown = true;
      const message = err instanceof Error ? err.message : err;
      const currentToken = this._cursor.peek();
      const stateEndIndex = currentToken.type !== 27 /* EOF */ ? currentToken.span.end : void 0;
      throw `[Parser] ${this._cursor.getPositionFromCharacterIndex(startOffset + 1)} - ${message}
 ---> ${slice(this._input, startOffset, stateEndIndex)}`;
    }
  }
};

// ../packages/compiler/src/type-checker/models/type-checker-context/type-checker-context.ts
var TypeCheckContext = class extends CompilerContext {
  /**
   * Creates a new type checker scope.
   *
   * @param parent - Optional enclosing scope; its imports are visible from this scope.
   * @param _eventMap - Event map of the elements declared in this scope, when it differs from the one of the
   *   enclosing scope, i.e. for the children of an `<svg>` or a `<math>` element.
   */
  constructor(parent, _eventMap) {
    super(parent);
    this._eventMap = _eventMap;
  }
  /**
   * Array of component and directive imports to be tracked during type checking.
   * Stores metadata extracted from @WebComponent and @Directive decorators.
   */
  _imports = new Array();
  /**
   * Adds a new component or directive import to the type checker context.
   *
   * @param value - The component or directive import metadata to be added
   */
  addImport(...value) {
    this._imports.push(...value);
  }
  /**
   * Returns the event map of the elements declared in this scope, looking in this
   * scope first and then in the ancestor scopes.
   *
   * @returns The event map of the closest scope declaring one, `HTMLElementEventMap` if none does.
   */
  get eventMap() {
    return this._eventMap ?? this.parent?.eventMap ?? "HTMLElementEventMap";
  }
  /**
   * Finds the component registered for the given selector, looking in this
   * scope first and then in the ancestor scopes.
   *
   * @param tagName - The tag name to look up.
   * @returns The matching component metadata, if any.
   */
  getImportBySelector(tagName) {
    return this._imports.find((importValue) => importValue.type === "component" && importValue.selector === tagName) ?? this.parent?.getImportBySelector(tagName);
  }
  /**
   * Finds the directive registered for the given selector, looking in this
   * scope first and then in the ancestor scopes.
   *
   * @param selector - The directive selector to look up.
   * @returns The matching directive metadata, if any.
   */
  getDirectiveBySelector(selector) {
    return this._imports.find((importValue) => importValue.type === "directive" && importValue.selector === selector) ?? this.parent?.getDirectiveBySelector(selector);
  }
};

// ../packages/compiler/src/type-checker/states/type-check-element/type-check-element.state.ts
var import_typescript6 = require("typescript");

// ../packages/compiler/src/type-checker/utils/line-builder/line-builder.utils.ts
function mapped(text, span) {
  return { text, span };
}
function line(...parts) {
  let text = "";
  const mappings = new Array();
  for (const part of parts) {
    if (typeof part === "string") {
      text = `${text}${part}`;
    } else {
      const columnStart = text.length;
      text = `${text}${part.text}`;
      mappings.push({ columnStart, columnEnd: text.length, original: part.span });
    }
  }
  return mappings.length ? { text, mappings } : { text };
}
function plain(text) {
  return { text };
}
function indentLines(lines) {
  return lines.map((line2) => ({
    text: " ".repeat(2) + line2.text,
    mappings: line2.mappings?.map((mapping) => ({
      ...mapping,
      columnStart: mapping.columnStart + 2,
      columnEnd: mapping.columnEnd + 2
    }))
  }));
}

// ../packages/compiler/src/type-checker/states/type-check-element/type-check-element.state.ts
function typeCheckElement(node, processNode, context) {
  const lines = new Array();
  const eventMap = getElementEventMap(node.tagName, context);
  if (isCustomElementTag(node.tagName)) {
    const metadata = context.getImportBySelector(node.tagName);
    if (!metadata) {
      throw new Error(`${node.tagName} selector is not associated to any WebComponent imported in the template`, { cause: node.span });
    }
    lines.push(...typeCheckComponentBindings(node, metadata, eventMap, context));
  } else {
    lines.push(...typeCheckNativeBindings(node, eventMap, context));
  }
  lines.push(...typeCheckDirectives([...node.directives, ...node.structuralDirectives], node.tagName, eventMap, context));
  const childrenContext = eventMap === context.eventMap ? context : new TypeCheckContext(context, eventMap);
  const children = node.children;
  for (let i2 = 0; i2 < children.length; i2++) {
    lines.push(...processNode(children[i2], childrenContext));
  }
  return lines;
}
function getElementEventMap(tagName, context) {
  switch (tagName) {
    case "svg":
      return "SVGElementEventMap";
    case "math":
      return "MathMLElementEventMap";
    default:
      return context.eventMap;
  }
}
function typeCheckComponentBindings(node, metadata, eventMap, context) {
  const requiredProperties = new Set(metadata.properties.entries().filter(([_2, value]) => value.required).map(([key]) => key));
  const alwaysBoundAttributes = getAlwaysBoundAttributes(node.conditionalBindings);
  const lines = typeCheckComponentAttributes(node.attributes, metadata, context);
  const conditionalBindingLines = typeCheckConditionalBindings(node.conditionalBindings, context, (branch) => {
    assertRequiredPropertiesAlwaysBound(branch.attributes, metadata, `<${node.tagName}>`, alwaysBoundAttributes);
    return [
      ...typeCheckComponentAttributes(branch.attributes, metadata, context),
      ...typeCheckComponentEvents(branch.events, `<${node.tagName}>`, metadata, context),
      ...typeCheckDirectives([...branch.directives, ...branch.structuralDirectives], node.tagName, eventMap, context)
    ];
  });
  for (let i2 = 0; i2 < node.attributes.length; i2++) {
    const { name } = node.attributes[i2];
    requiredProperties.delete(name);
  }
  alwaysBoundAttributes.forEach((name) => requiredProperties.delete(name));
  if (requiredProperties.size) {
    throw new Error(`${node.tagName} is missing the following required properties:
 \u25CF ${Array.from(requiredProperties.values()).join("\n \u25CF ")}`, { cause: node.span });
  }
  lines.push(...typeCheckComponentEvents(node.events, `<${node.tagName}>`, metadata, context));
  lines.push(...conditionalBindingLines);
  return lines;
}
function typeCheckDirectives(directives, tagName, eventMap, context) {
  const lines = new Array();
  for (let i2 = 0; i2 < directives.length; i2++) {
    const directive = directives[i2];
    const { selector, attributes, span, type } = directive;
    const { events, conditionalBindings } = type === 15 /* Directive */ ? directive : { events: [], conditionalBindings: [] };
    const owner = `${type === 15 /* Directive */ ? "@@" : "*"}${selector}`;
    const metadata = context.getDirectiveBySelector(selector);
    if (!metadata) {
      throw new Error(`${owner} selector is not associated to any Directive imported in the template`, { cause: span });
    }
    assertDirectiveProperties(attributes, metadata, owner);
    const alwaysBoundAttributes = getAlwaysBoundAttributes(conditionalBindings);
    const conditionalBindingLines = typeCheckConditionalBindings(conditionalBindings, context, (branch) => {
      assertDirectiveProperties(branch.attributes, metadata, owner);
      assertRequiredPropertiesAlwaysBound(branch.attributes, metadata, owner, alwaysBoundAttributes);
      return [
        ...typeCheckComponentAttributes(branch.attributes, metadata, context),
        ...typeCheckComponentEvents(branch.events, owner, metadata, context, eventMap)
      ];
    });
    const requiredProperties = new Set(metadata.properties.entries().filter(([_2, value]) => value.required).map(([key]) => key));
    for (let j = 0; j < attributes.length; j++) {
      requiredProperties.delete(attributes[j].name);
    }
    alwaysBoundAttributes.forEach((name) => requiredProperties.delete(name));
    if (requiredProperties.size) {
      throw new Error(`${owner} on <${tagName}> is missing the following required properties:
 \u25CF ${Array.from(requiredProperties.values()).join("\n \u25CF ")}`, { cause: span });
    }
    lines.push(
      ...typeCheckComponentAttributes(attributes, metadata, context),
      ...typeCheckComponentEvents(events, owner, metadata, context, eventMap),
      ...conditionalBindingLines
    );
  }
  return lines;
}
function assertDirectiveProperties(attributes, metadata, owner) {
  for (let i2 = 0; i2 < attributes.length; i2++) {
    const { name, span } = attributes[i2];
    if (!metadata.properties.has(name)) {
      throw new Error(`Unknown property "${name}" on ${owner} (${metadata.className} has no @Property with this name).`, { cause: span });
    }
  }
}
function assertRequiredPropertiesAlwaysBound(attributes, metadata, owner, alwaysBoundAttributes) {
  for (let i2 = 0; i2 < attributes.length; i2++) {
    const { name, span } = attributes[i2];
    if (metadata.properties.get(name)?.required && !alwaysBoundAttributes.has(name)) {
      throw new Error(`Required property "${name}" of ${owner} must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.`, { cause: span });
    }
  }
}
function getAlwaysBoundAttributes(conditionalBindings) {
  const alwaysBoundAttributes = /* @__PURE__ */ new Set();
  for (let i2 = 0; i2 < conditionalBindings.length; i2++) {
    const { branches } = conditionalBindings[i2];
    if (branches.at(-1)?.condition !== null) {
      continue;
    }
    const [first, ...others] = branches.map((branch) => /* @__PURE__ */ new Set([
      ...branch.attributes.map(({ name }) => name),
      ...getAlwaysBoundAttributes(branch.conditionalBindings)
    ]));
    first.forEach((name) => {
      if (others.every((boundInBranch) => boundInBranch.has(name))) {
        alwaysBoundAttributes.add(name);
      }
    });
  }
  return alwaysBoundAttributes;
}
function typeCheckComponentAttributes(attributes, metadata, context) {
  const lines = new Array();
  for (let i2 = 0; i2 < attributes.length; i2++) {
    const { name, value } = attributes[i2];
    const property = metadata.properties.get(name);
    if (property) {
      lines.push(
        plain("{"),
        ...indentLines(
          typeof value === "object" ? [line("(", mapped(resolveExpression(value.expression, context, { resolver: "root" }).expression, value.span), `) satisfies ${property.type};`)] : [plain("let x!: string;"), line(mapped(`x satisfies ${property.type};`, attributes[i2].span))]
        ),
        plain("}")
      );
    }
  }
  return lines;
}
function typeCheckComponentEvents(events, owner, metadata, context, eventMap) {
  const lines = new Array();
  for (let i2 = 0; i2 < events.length; i2++) {
    const { name, span } = events[i2];
    const event = metadata.events.get(name);
    if (event) {
      lines.push(...typeCheckEvent(events[i2], event.type === "void" ? null : `CustomEvent<${event.type}>`, context));
    } else if (eventMap) {
      lines.push(...typeCheckEvent(events[i2], getNativeEventType(eventMap, name), context));
    } else {
      throw new Error(`Unknown event "${name}" on ${owner} (${metadata.className} has no @Event with this name).`, { cause: span });
    }
  }
  return lines;
}
function typeCheckNativeBindings(node, eventMap, context) {
  return [
    ...typeCheckNativeAttributes(node.attributes, context),
    ...typeCheckNativeEvents(node.events, eventMap, context),
    ...typeCheckConditionalBindings(node.conditionalBindings, context, (branch) => [
      ...typeCheckNativeAttributes(branch.attributes, context),
      ...typeCheckNativeEvents(branch.events, eventMap, context),
      ...typeCheckDirectives([...branch.directives, ...branch.structuralDirectives], node.tagName, eventMap, context)
    ])
  ];
}
function typeCheckNativeAttributes(attributes, context) {
  const lines = new Array();
  for (let i2 = 0; i2 < attributes.length; i2++) {
    const { value } = attributes[i2];
    if (typeof value !== "string") {
      lines.push(line(mapped(`${resolveExpression(value.expression, context, { resolver: "root" }).expression};`, value.span)));
    }
  }
  ;
  return lines;
}
function typeCheckNativeEvents(events, eventMap, context) {
  return events.flatMap((event) => typeCheckEvent(event, getNativeEventType(eventMap, event.name), context));
}
function typeCheckEvent({ handler, parameters, span }, eventType, context) {
  const eventContext = new TypeCheckContext(context);
  eventContext.addUnresolvableIdentifier("$event");
  const args = parameters.map((parameter) => resolveExpression(parameter, eventContext, { resolver: "root" }).expression).join(", ");
  const call = line(mapped(`root.${handler}(${args});`, span));
  return eventType && passesEvent(parameters) ? [
    plain("{"),
    ...indentLines([
      plain(`let $event!: ${eventType};`),
      call
    ]),
    plain("}")
  ] : [call];
}
function passesEvent(parameters) {
  return parameters.some((parameter) => (0, import_typescript6.isIdentifier)(parameter) && parameter.text === "$event");
}
function typeCheckConditionalBindings(conditionalBindings, context, bindings) {
  const lines = new Array();
  const typeCheckBranch = (branch) => indentLines([
    ...bindings(branch),
    ...typeCheckConditionalBindings(branch.conditionalBindings, context, bindings)
  ]);
  for (let i2 = 0; i2 < conditionalBindings.length; i2++) {
    const conditionalBinding = conditionalBindings[i2];
    lines.push(...conditionalBinding.type === 13 /* SwitchBinding */ ? typeCheckSwitchBinding(conditionalBinding, context, typeCheckBranch) : typeCheckIfBinding(conditionalBinding, context, typeCheckBranch));
  }
  return lines;
}
function typeCheckIfBinding(node, context, typeCheckBranch) {
  const lines = new Array();
  const { branches } = node;
  for (let i2 = 0; i2 < branches.length; i2++) {
    const branch = branches[i2];
    const { condition, span } = branch;
    lines.push(
      // Only the first branch opens the chain, only the `@else` one has no condition
      condition ? line(i2 ? "else if (" : "if (", mapped(resolveExpression(condition, context, { resolver: "root" }).expression, span), ") {") : plain("else {"),
      ...typeCheckBranch(branch),
      plain("}")
    );
  }
  return lines;
}
function typeCheckSwitchBinding(node, context, typeCheckBranch) {
  const { expression } = resolveExpression(node.expression, context, { resolver: "root" });
  const lines = [line("switch (", mapped(expression, node.span), ") {")];
  const { branches } = node;
  for (let i2 = 0; i2 < branches.length; i2++) {
    const branch = branches[i2];
    const labels = branch.condition?.map((condition) => plain(`case ${condition}:`)) ?? [plain("default:")];
    lines.push(...indentLines([
      ...labels,
      ...typeCheckBranch(branch),
      ...indentLines([plain("break;")])
    ]));
  }
  lines.push(plain("}"));
  return lines;
}
function getNativeEventType(eventMap, name) {
  return `${eventMap}['${name}']`;
}
function isCustomElementTag(tagName) {
  return /^[a-z][a-z0-9._\-]*-[a-z0-9._\-]*$/.test(tagName);
}

// ../packages/compiler/src/type-checker/states/type-check-for/type-check-for.state.ts
var FOR_ITERABLE = "(<T extends number | readonly unknown[]>(iterable: T): T extends number ? number[] : T => iterable as never)";
function typeCheckFor(node, processNode, context) {
  const forContext = new TypeCheckContext(context);
  const indexName = resolveImplicit2(node, "$index");
  const firstName = resolveImplicit2(node, "$first");
  const lastName = resolveImplicit2(node, "$last");
  const evenName = resolveImplicit2(node, "$even");
  const oddName = resolveImplicit2(node, "$odd");
  if (node.itemAlias) {
    forContext.addUnresolvableIdentifier(node.itemAlias);
  }
  const identifiers = [indexName, firstName, lastName, evenName, oddName];
  for (let i2 = 0; i2 < identifiers.length; i2++) {
    forContext.addUnresolvableIdentifier(identifiers[i2], "signal");
  }
  const lines = new Array();
  const iterable = resolveExpression(node.iterableExpression, context, { resolver: "root" }).expression;
  lines.push(line(`for (const ${node.itemAlias ?? "_"} of ${FOR_ITERABLE}(`, mapped(iterable, node.span), ")) {"));
  lines.push(...indentLines([
    plain(`let ${indexName}!: Signal<number>;`),
    plain(`let ${firstName}!: Signal<boolean>;`),
    plain(`let ${lastName}!: Signal<boolean>;`),
    plain(`let ${evenName}!: Signal<boolean>;`),
    plain(`let ${oddName}!: Signal<boolean>;`),
    line(mapped(`${resolveExpression(node.trackExpression, forContext).expression};`, node.span)),
    ...node.children.flatMap((child) => processNode(child, forContext))
  ]));
  lines.push(plain("}"));
  return lines;
}
function resolveImplicit2(node, implicit) {
  return node.implicitAliases.get(implicit) ?? implicit;
}

// ../packages/compiler/src/type-checker/states/type-check-if/type-check-if.state.ts
function typeCheckIf(node, processNode, context) {
  const lines = new Array();
  const condition = resolveExpression(node.conditionNode, context, { resolver: "root" });
  lines.push(line("if (", mapped(condition.expression, node.span), ") {"));
  lines.push(...indentLines(node.children.flatMap((child) => processNode(child, context))));
  lines.push(plain("}"));
  let alt = node.alternate;
  while (alt?.type === 7 /* ElseIf */) {
    const elseIfCondition = resolveExpression(alt.conditionNode, context, { resolver: "root" });
    lines.push(line("else if (", mapped(elseIfCondition.expression, alt.span), ") {"));
    lines.push(...indentLines(alt.children.flatMap((child) => processNode(child, context))));
    lines.push(plain("}"));
    alt = alt.alternate;
  }
  if (alt) {
    lines.push(plain("else {"));
    lines.push(...indentLines(alt.children.flatMap((child) => processNode(child, context))));
    lines.push(plain("}"));
  }
  return lines;
}

// ../packages/compiler/src/type-checker/states/type-check-switch/type-check-switch.state.ts
function typeCheckSwitch(node, processNode, context) {
  const { expression } = resolveExpression(node.expression, context, { resolver: "root" });
  const lines = [line("switch (", mapped(expression, node.span), ") {")];
  const children = node.children;
  for (let i2 = 0; i2 < children.length; i2++) {
    const caseNode = children[i2];
    const conditions = caseNode.condition;
    if (conditions?.length) {
      for (let j = 0; j < conditions.length; j++) {
        lines.push(plain(`  case ${conditions[j]}:`));
      }
    } else {
      lines.push(plain("  default:"));
    }
    lines.push(...indentLines(
      indentLines([
        ...caseNode.children.flatMap((child) => processNode(child, context)),
        plain("break;")
      ])
    ));
  }
  lines.push(plain("}"));
  return lines;
}

// ../packages/compiler/src/type-checker/states/type-check-text-and-interpolation/type-check-text-and-interpolation.state.ts
function typeCheckTextAndInterpolation(node, _processNode, context) {
  return node.type === 4 /* Interpolation */ ? [line(mapped(`${resolveExpression(node.expression, context, { resolver: "root" }).expression};`, node.span))] : [];
}

// ../packages/compiler/src/type-checker/type-checker/type-checker.ts
var TypeChecker = class {
  /**
   * @param _input - Raw template source string, used only to slice diagnostic spans into error messages.
   * @param _ast   - Parsed AST produced by the `Parser` for this template.
   */
  constructor(_input, _ast) {
    this._input = _input;
    this._ast = _ast;
  }
  /** 
   * Shared mutable state threaded through all state functions during a single `generate()` call. 
   */
  _context = new TypeCheckContext();
  /** 
   * Maps each `ASTNodeType` to the state function responsible for emitting its type-check lines. 
   */
  _states = {
    [3 /* Text */]: typeCheckTextAndInterpolation,
    [4 /* Interpolation */]: typeCheckTextAndInterpolation,
    [0 /* Element */]: typeCheckElement,
    [5 /* If */]: typeCheckIf,
    [8 /* For */]: typeCheckFor,
    [9 /* Switch */]: typeCheckSwitch,
    [11 /* Import */]: () => []
  };
  /**
   * Generates the full `function typeCheck() { ... }` shim body for the
   * component's template.
   *
   * `$event` is not declared at the top of the shim: every event binding passing it
   * to its handler gets its own block declaring it, as `CustomEvent<payload type>` for a component or directive
   * `@Event` carrying a payload, and through the event map of the element for a native event, e.g.
   * `HTMLElementEventMap['click']` or, inside an `<svg>`, `SVGElementEventMap['click']`.
   *
   * @param metadatas - Metadata of the components and directives imported in the template, used to check the elements and directives using their selectors.
   * @returns The text of the shim, together with the table mapping its lines to the spans of the template they come from.
   * @throws If the template fails type-checking, e.g. it uses a selector not imported in it, with the error message prefixed by `[TypeChecker]` and, when the error carries its span, the slice of the template it refers to.
   */
  async generate(metadatas) {
    try {
      this._context.addImport(...metadatas);
      const body = this._ast.flatMap((node) => this._processNode(node, this._context));
      const lines = [
        plain("function typeCheck() {"),
        ...indentLines(body),
        plain("}")
      ];
      return {
        text: lines.map((line2) => line2.text).join("\n"),
        mappingTable: this.buildMappingTable(lines)
      };
    } catch (err) {
      throw catchErrorWithPrefix("TypeChecker", this._input, err);
    }
  }
  /**
   * Builds a mapping table that correlates each generated line to its original source span.
   * @param lines - Array of lines generated for the type-checking shim.
   * @returns A mapping table correlating generated lines to their original source spans.
   */
  buildMappingTable(lines) {
    const table = /* @__PURE__ */ new Map();
    lines.forEach((line2, index) => {
      if (line2.mappings) {
        table.set(index, line2.mappings);
      }
      ;
    });
    return table;
  }
  /**
   * Dispatches a single AST node to its state function, passing itself
   * back down as `processNode` so state functions can recurse into their
   * own children inline.
   */
  _processNode = (node, context) => {
    const state = this._states[node.type];
    if (!state) {
      throw new Error(`No transition function for ASTNode of type ${ASTNodeType[node.type]}`, { cause: node.span });
    }
    return state(node, this._processNode, context);
  };
};

// ../packages/compiler/src/compile/compile.ts
async function compile(input, options) {
  const tokens = new Lexer(input).tokenize();
  const nodes = new Parser(input, tokens).parse();
  const { baseDir, signals, cache } = options;
  const importNodes = nodes.filter((node) => node.type === 11 /* Import */);
  if (baseDir && signals) {
    const metadatas = await extractComponentMetadataReferredInTemplate(importNodes, baseDir, cache);
    const [javascript, typescript] = await Promise.all([
      generateJavascriptCode(input, nodes, signals, cache),
      generateTypecheckResult(input, nodes, metadatas)
    ]);
    return {
      javascript,
      typescript
    };
  } else if (baseDir) {
    const metadatas = await extractComponentMetadataReferredInTemplate(importNodes, baseDir, cache);
    return await generateTypecheckResult(input, nodes, metadatas);
  } else {
    return await generateJavascriptCode(input, nodes, signals, cache);
  }
}
async function generateJavascriptCode(input, nodes, signals, cache) {
  return await new Generator(input, nodes, cache).generate(signals);
}
async function generateTypecheckResult(input, nodes, metadatas) {
  return await new TypeChecker(input, nodes).generate(metadatas);
}
async function extractComponentMetadataReferredInTemplate(nodes, baseDir, cache) {
  const importNodes = nodes.filter((node) => node.type === 11 /* Import */);
  const promises = new Array();
  for (let i2 = 0; i2 < importNodes.length; i2++) {
    const { specifiers, path } = importNodes[i2];
    for (let j = 0; j < specifiers.length; j++) {
      const { imported, local } = specifiers[j];
      if (imported !== "*") {
        const name = imported === "default" ? local : imported;
        promises.push(cache.getOrInsert(name, [baseDir, path]));
      }
    }
  }
  return await Promise.all(promises);
}

// ../packages/compiler/src/utils/extract-signals/extract-signals.utils.ts
var import_node_fs2 = require("fs");
var import_typescript7 = require("typescript");
var DEFAULT_COMPILER_OPTIONS = {
  module: import_typescript7.ModuleKind.ESNext,
  moduleResolution: import_typescript7.ModuleResolutionKind.Bundler
};

// ../packages/compiler/src/utils/metadata/metadata.utils.ts
var import_typescript8 = require("typescript");

// ../packages/language-server/src/lib/document-manager.ts
var import_node_path3 = require("path");
var compiledCache = /* @__PURE__ */ new Map();
async function compileTemplate(templateUri, templateSource, componentData) {
  const typecheckBody = await compile(templateSource, { baseDir: (0, import_node_path3.dirname)(templateUri), cache: {} });
  const shim = createShim(componentData, typecheckBody);
  const compiled = {
    typecheckBody,
    shimPath: shim.path,
    bodyLineOffset: shim.bodyLineOffset,
    classNames: shim.classNames
  };
  compiledCache.set(templateUri, compiled);
  return compiled;
}

// ../packages/language-server/src/lib/template-registry.ts
var import_fast_glob = __toESM(require_out4(), 1);
var import_node_path4 = require("path");
var templateToComponent = /* @__PURE__ */ new Map();
var componentToTemplate = /* @__PURE__ */ new Map();
async function buildComponentIndex(workspaceRoots2) {
  for (let i2 = 0; i2 < workspaceRoots2.length; i2++) {
    const componentFiles = await (0, import_fast_glob.default)("**/*.xd.component.ts", {
      cwd: workspaceRoots2[i2],
      absolute: true,
      ignore: ["**/node_modules/**", "**/dist/**"]
    });
    for (let j = 0; j < componentFiles.length; j++) {
    }
  }
}
function indexComponent(_componentPath) {
  try {
  } catch (err) {
    console.warn(err);
  }
}
function removeComponentFromIndex(componentPath) {
  const templatePath = componentToTemplate.get(componentPath);
  if (templatePath) {
    templateToComponent.delete(templatePath);
  }
  componentToTemplate.delete(componentPath);
}
function resolveComponentForTemplate(templatePath) {
  const path = (0, import_node_path4.resolve)(templatePath);
  return templateToComponent.get(path);
}

// ../packages/language-server/src/lib/server-handlers.ts
function onInitialize(params, setWorkspaceRoots) {
  const workspaceFolders = params.workspaceFolders;
  if (workspaceFolders?.length) {
    setWorkspaceRoots(workspaceFolders.map((folder) => fromUri(folder.uri)));
  }
  return {
    capabilities: {
      textDocumentSync: import_node20.TextDocumentSyncKind.Incremental,
      completionProvider: { triggerCharacters: [".", "{", "("] },
      hoverProvider: true
    }
  };
}
async function onInitialized(workspaceRoots2) {
  await buildComponentIndex(workspaceRoots2);
}
function onDidChangeWatchedFiles(event) {
  for (let i2 = 0; i2 < event.changes.length; i2++) {
    const change = event.changes[i2];
    const path = fromUri(change.uri);
    if (path.endsWith(".xd.component.ts")) {
      change.type === import_node20.FileChangeType.Deleted ? removeComponentFromIndex(path) : indexComponent(path);
    }
  }
}
async function onCompletion(params, documents) {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) {
    return [];
  }
  const templatePath = fromUri(params.textDocument.uri);
  const componentPaths = resolveComponentForTemplate(templatePath);
  if (!componentPaths) {
    return [];
  }
  const compiled = await compileTemplate(templatePath, doc.getText(), componentPaths);
  const shimPosition = mapTemplatePositionToShim(compiled.typecheckBody.mappingTable, compiled.bodyLineOffset, doc, params.position);
  if (!shimPosition) {
    return [];
  }
  const tsConfig = loadTsConfig((0, import_node_path5.dirname)(templatePath));
  const languageService2 = getLanguageService(tsConfig.options, tsConfig.fileNames);
  const shimSourceFile = languageService2.getProgram()?.getSourceFile(compiled.shimPath);
  const offset = shimSourceFile.getPositionOfLineAndCharacter(shimPosition.line, shimPosition.character);
  const tsCompletions = languageService2.getCompletionsAtPosition(compiled.shimPath, offset, {});
  return tsCompletions ? tsCompletions.entries.map((entry) => ({
    label: entry.name,
    kind: mapKind(entry.kind),
    sortText: entry.sortText
  })) : [];
}
function mapTemplatePositionToShim(mappingTable, bodyLineOffset, templateDocument, position) {
  const charIndex = templateDocument.offsetAt(position);
  for (const [shimLine, lineMappings] of mappingTable) {
    for (const mapping of lineMappings) {
      if (charIndex >= mapping.original.start && charIndex < mapping.original.end) {
        const offsetInSpan = charIndex - mapping.original.start;
        const shimColumn = mapping.columnStart + offsetInSpan;
        return shimColumn >= mapping.columnEnd ? { line: shimLine + bodyLineOffset, character: shimColumn } : void 0;
      }
    }
  }
}
function mapKind(kind) {
  switch (kind) {
    case import_typescript9.ScriptElementKind.memberVariableElement:
      return import_node20.CompletionItemKind.Field;
    case import_typescript9.ScriptElementKind.memberFunctionElement:
      return import_node20.CompletionItemKind.Method;
    case import_typescript9.ScriptElementKind.functionElement:
      return import_node20.CompletionItemKind.Function;
    default:
      return import_node20.CompletionItemKind.Text;
  }
}
var timers = /* @__PURE__ */ new Map();
function debounce(fn, ms) {
  return (key, document, connection) => {
    const existing = timers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    timers.set(key, setTimeout(() => {
      timers.delete(key);
      fn(key, document, connection);
    }, ms));
  };
}
async function validate(uri, document, connection) {
  try {
    if (!uri.endsWith(".xd.component.html")) {
      return;
    }
    const componentPath = resolveComponentForTemplate(uri);
    if (!componentPath) {
      return;
    }
    const tsConfig = loadTsConfig((0, import_node_path5.dirname)(uri));
    const compiled = await compileTemplate(uri, document.getText(), componentPath);
    const languageService2 = getLanguageService(tsConfig.options, tsConfig.fileNames);
    const tsDiagnostics = languageService2.getSemanticDiagnostics(compiled.shimPath);
    connection.sendDiagnostics({
      uri,
      diagnostics: tsDiagnostics.map(toLspDiagnostic)
    });
  } catch (err) {
    connection.sendDiagnostics({
      uri,
      diagnostics: [{
        message: err instanceof Error ? err.message : String(err),
        severity: import_node20.DiagnosticSeverity.Error,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        source: "xaendar"
      }]
    });
  }
}
function toLspDiagnostic(diagnostic) {
  const start = diagnostic.start ?? 0;
  const length = diagnostic.length ?? 0;
  let startPosition = import_node20.Position.create(0, 0);
  let endPosition = import_node20.Position.create(0, 0);
  if (diagnostic.file) {
    const tsStart = diagnostic.file.getLineAndCharacterOfPosition(start);
    const tsEnd = diagnostic.file.getLineAndCharacterOfPosition(start + length);
    startPosition = import_node20.Position.create(tsStart.line, tsStart.character);
    endPosition = import_node20.Position.create(tsEnd.line, tsEnd.character);
  }
  return {
    message: typeof diagnostic.messageText === "string" ? diagnostic.messageText : diagnostic.messageText.messageText,
    severity: mapSeverity(diagnostic.category),
    range: {
      start: startPosition,
      end: endPosition
    },
    source: "xaendar"
  };
}
function mapSeverity(kind) {
  switch (kind) {
    case import_typescript9.DiagnosticCategory.Error:
      return import_node20.DiagnosticSeverity.Error;
    case import_typescript9.DiagnosticCategory.Warning:
      return import_node20.DiagnosticSeverity.Warning;
    case import_typescript9.DiagnosticCategory.Suggestion:
      return import_node20.DiagnosticSeverity.Hint;
    default:
      return import_node20.DiagnosticSeverity.Information;
  }
}
function fromUri(uri) {
  return u.parse(uri).fsPath;
}

// ../packages/language-server/src/lib/server.ts
var workspaceRoots = new Array();
setTimeout(() => {
  const connection = (0, import_node21.createConnection)(import_node21.ProposedFeatures.all);
  const documents = new import_node21.TextDocuments(TextDocument);
  connection.onInitialize((params) => onInitialize(params, (roots) => workspaceRoots = roots));
  connection.onInitialized(() => onInitialized(workspaceRoots));
  connection.onDidChangeWatchedFiles(onDidChangeWatchedFiles);
  connection.onCompletion((params) => onCompletion(params, documents));
  documents.onDidChangeContent((change) => debounce(() => validate(fromUri(change.document.uri), change.document, connection), 300));
  documents.listen(connection);
  connection.listen();
}, 5e3);
/*! Bundled license information:

is-extglob/index.js:
  (*!
   * is-extglob <https://github.com/jonschlinkert/is-extglob>
   *
   * Copyright (c) 2014-2016, Jon Schlinkert.
   * Licensed under the MIT License.
   *)

is-glob/index.js:
  (*!
   * is-glob <https://github.com/jonschlinkert/is-glob>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   *)

is-number/index.js:
  (*!
   * is-number <https://github.com/jonschlinkert/is-number>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

to-regex-range/index.js:
  (*!
   * to-regex-range <https://github.com/micromatch/to-regex-range>
   *
   * Copyright (c) 2015-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

fill-range/index.js:
  (*!
   * fill-range <https://github.com/jonschlinkert/fill-range>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Licensed under the MIT License.
   *)

queue-microtask/index.js:
  (*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)

run-parallel/index.js:
  (*! run-parallel. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
