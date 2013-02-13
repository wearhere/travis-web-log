// Generated by CoffeeScript 1.4.0
(function() {
  if(typeof window == 'undefined' && typeof exports == 'object') {
  $ = require('./vendor/jquery.fake.js').$;
  require('./vendor/ansiparse.js');
} else {
  exports = window
};

  var Log;

  Log = function(string) {
    this.parts = [];
    this.listeners = [];
    if (string) {
      this.set(0, string);
    }
    return this;
  };

  $.extend(Log.prototype, {
    trigger: function() {
      var listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        listener = _ref[_i];
        _results.push(listener.notify.apply(listener, arguments));
      }
      return _results;
    },
    set: function(num, string) {
      if (this.parts[num]) {
        return;
      }
      this.parts[num] = new Log.Part(this, num, string);
      return this.parts[num].insert();
    }
  });

  Log.Part = function(log, num, string) {
    var ix, line;
    this.log = log;
    this.num = num;
    this.lines = (function() {
      var _i, _len, _ref, _results;
      _ref = string.split(/^/m);
      _results = [];
      for (ix = _i = 0, _len = _ref.length; _i < _len; ix = ++_i) {
        line = _ref[ix];
        _results.push(new Log.Line(this, ix, line));
      }
      return _results;
    }).call(this);
    return this;
  };

  $.extend(Log.Part.prototype, {
    insert: function() {
      return new Log.Context(this.log, this).insert();
    },
    head: function() {
      var head, line;
      head = [];
      line = this.lines[0];
      while ((line = line != null ? line.prev() : void 0) && !line.isNewline()) {
        head.unshift(line);
      }
      return head;
    },
    tail: function() {
      var line, tail;
      tail = [];
      line = this.lines[this.lines.length - 1];
      while (line = line != null ? line.next() : void 0) {
        tail.push(line);
        if (line != null ? line.isNewline() : void 0) {
          break;
        }
      }
      return tail;
    },
    prev: function() {
      var num, prev;
      num = this.num;
      while (!(prev || num < 0)) {
        prev = this.log.parts[num -= 1];
      }
      return prev;
    },
    next: function() {
      var next, num;
      num = this.num;
      while (!(next || num >= this.log.parts.length)) {
        next = this.log.parts[num += 1];
      }
      return next;
    }
  });

  Log.Line = function(part, num, string) {
    this.part = part;
    this.num = num;
    this.id = "" + part.num + "-" + num;
    this.string = string;
    return this;
  };

  $.extend(Log.Line.prototype, {
    prev: function() {
      var line, _ref;
      line = this.part.lines[this.num - 1];
      return line || ((_ref = this.part.prev()) != null ? _ref.lines.slice(-1)[0] : void 0);
    },
    next: function() {
      var line, _ref;
      line = this.part.lines[this.num + 1];
      return line || ((_ref = this.part.next()) != null ? _ref.lines[0] : void 0);
    },
    isNewline: function() {
      return this.string[this.string.length - 1] === "\n";
    },
    clone: function() {
      return new Log.Line(this.part, this.num, this.string);
    }
  });

  Log.Context = function(log, part) {
    this.log = log;
    this.part = part;
    this.head = part.head();
    this.tail = part.tail();
    this.lines = this.join(this.head.concat(part.lines).concat(this.tail));
    return this;
  };

  $.extend(Log.Context.prototype, {
    insert: function() {
      var ids;
      ids = this.head.concat(this.tail).map(function(line) {
        return line.id;
      });
      if (ids.length !== 0) {
        this.log.trigger('remove', ids);
      }
      return this.log.trigger('insert', this.after(), this.html());
    },
    html: function() {
      var nodes,
        _this = this;
      nodes = this.lines.map(function(line) {
        var string, style;
        string = line.string;
        string = _this.deansi(string);
        style = string === '' ? ' style="display: none;"' : '';
        return "<p id=\"" + line.id + "\"" + style + "><a id=\"\"></a>" + (string.replace(/\n/gm, '')) + "</p>";
      });
      return nodes.join("\n");
    },
    join: function(all) {
      var line, lines;
      lines = [];
      while (line = all.pop()) {
        if (lines.length === 0 || line.isNewline()) {
          lines.unshift(line.clone());
        } else {
          lines[0].string = line.string + lines[0].string;
        }
      }
      return lines;
    },
    after: function() {
      var line, _ref;
      line = (_ref = this.part.lines[0]) != null ? _ref.prev() : void 0;
      while (line && !line.isNewline()) {
        line = line.prev();
      }
      return line != null ? line.id : void 0;
    },
    deansi: function(string) {
      return Log.Deansi.apply(string);
    }
  });

  Log.Deansi = {
    apply: function(string) {
      var result,
        _this = this;
      string = string.replace(/.*\033\[K\n/gm, '').replace(/\033\(B/g, '').replace(/\033\[\d+G/g, '').replace(/\[2K/g, '');
      result = '';
      ansiparse(string).forEach(function(part) {
        return result += _this.span(part.text, _this.classes(part));
      });
      return result.replace(/\033/g, '');
    },
    classes: function(part) {
      var result;
      result = [];
      if (part.foreground) {
        result.push(part.foreground);
      }
      if (part.background) {
        result.push("bg-" + part.background);
      }
      if (part.bold) {
        result.push('bold');
      }
      if (part.italic) {
        result.push('italic');
      }
      return result;
    },
    span: function(string, classes) {
      if (classes != null ? classes.length : void 0) {
        return "<span class='" + (classes.join(' ')) + "'>" + string + "</span>";
      } else {
        return string;
      }
    }
  };

  Log.Renderer = function() {};

  $.extend(Log.Renderer.prototype, {
    notify: function(event, num) {
      console.log(Array.prototype.slice.call(arguments));
      return this[event].apply(this, Array.prototype.slice.call(arguments, 1));
    },
    insert: function(after, html) {
      html = html.replace(/\n/gm, '');
      if (after) {
        return $(html).insertAfter("#log #" + after).renumber();
      } else {
        return $('#log').prepend(html).find('p').renumber();
      }
    },
    remove: function(ids) {
      var id, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        _results.push($("#log #" + id).remove());
      }
      return _results;
    }
  });

  $.fn.renumber = function() {
    var num, prev;
    prev = this.prev();
    num = prev.length > 0 ? parseInt(prev.find('a')[0].id.replace('L', '')) || 0 : 0;
    return this.find('a').attr('id', "L" + (num + 1)).html(num + 1);
  };

  exports.Log = Log;

}).call(this);
