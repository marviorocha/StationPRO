var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* assets/src/components/Container.svelte generated by Svelte v3.6.1 */

    const file = "assets/src/components/Container.svelte";

    function create_fragment(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "Container");
    			add_location(div, file, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { $$slots, $$scope };
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var howler = createCommonjsModule(function (module, exports) {
    /*!
     *  howler.js v2.2.1
     *  howlerjs.com
     *
     *  (c) 2013-2020, James Simpson of GoldFire Studios
     *  goldfirestudios.com
     *
     *  MIT License
     */

    (function() {

      /** Global Methods **/
      /***************************************************************************/

      /**
       * Create the global controller. All contained methods and properties apply
       * to all sounds that are currently playing or will be in the future.
       */
      var HowlerGlobal = function() {
        this.init();
      };
      HowlerGlobal.prototype = {
        /**
         * Initialize the global Howler object.
         * @return {Howler}
         */
        init: function() {
          var self = this || Howler;

          // Create a global ID counter.
          self._counter = 1000;

          // Pool of unlocked HTML5 Audio objects.
          self._html5AudioPool = [];
          self.html5PoolSize = 10;

          // Internal properties.
          self._codecs = {};
          self._howls = [];
          self._muted = false;
          self._volume = 1;
          self._canPlayEvent = 'canplaythrough';
          self._navigator = (typeof window !== 'undefined' && window.navigator) ? window.navigator : null;

          // Public properties.
          self.masterGain = null;
          self.noAudio = false;
          self.usingWebAudio = true;
          self.autoSuspend = true;
          self.ctx = null;

          // Set to false to disable the auto audio unlocker.
          self.autoUnlock = true;

          // Setup the various state values for global tracking.
          self._setup();

          return self;
        },

        /**
         * Get/set the global volume for all sounds.
         * @param  {Float} vol Volume from 0.0 to 1.0.
         * @return {Howler/Float}     Returns self or current volume.
         */
        volume: function(vol) {
          var self = this || Howler;
          vol = parseFloat(vol);

          // If we don't have an AudioContext created yet, run the setup.
          if (!self.ctx) {
            setupAudioContext();
          }

          if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
            self._volume = vol;

            // Don't update any of the nodes if we are muted.
            if (self._muted) {
              return self;
            }

            // When using Web Audio, we just need to adjust the master gain.
            if (self.usingWebAudio) {
              self.masterGain.gain.setValueAtTime(vol, Howler.ctx.currentTime);
            }

            // Loop through and change volume for all HTML5 audio nodes.
            for (var i=0; i<self._howls.length; i++) {
              if (!self._howls[i]._webAudio) {
                // Get all of the sounds in this Howl group.
                var ids = self._howls[i]._getSoundIds();

                // Loop through all sounds and change the volumes.
                for (var j=0; j<ids.length; j++) {
                  var sound = self._howls[i]._soundById(ids[j]);

                  if (sound && sound._node) {
                    sound._node.volume = sound._volume * vol;
                  }
                }
              }
            }

            return self;
          }

          return self._volume;
        },

        /**
         * Handle muting and unmuting globally.
         * @param  {Boolean} muted Is muted or not.
         */
        mute: function(muted) {
          var self = this || Howler;

          // If we don't have an AudioContext created yet, run the setup.
          if (!self.ctx) {
            setupAudioContext();
          }

          self._muted = muted;

          // With Web Audio, we just need to mute the master gain.
          if (self.usingWebAudio) {
            self.masterGain.gain.setValueAtTime(muted ? 0 : self._volume, Howler.ctx.currentTime);
          }

          // Loop through and mute all HTML5 Audio nodes.
          for (var i=0; i<self._howls.length; i++) {
            if (!self._howls[i]._webAudio) {
              // Get all of the sounds in this Howl group.
              var ids = self._howls[i]._getSoundIds();

              // Loop through all sounds and mark the audio node as muted.
              for (var j=0; j<ids.length; j++) {
                var sound = self._howls[i]._soundById(ids[j]);

                if (sound && sound._node) {
                  sound._node.muted = (muted) ? true : sound._muted;
                }
              }
            }
          }

          return self;
        },

        /**
         * Handle stopping all sounds globally.
         */
        stop: function() {
          var self = this || Howler;

          // Loop through all Howls and stop them.
          for (var i=0; i<self._howls.length; i++) {
            self._howls[i].stop();
          }

          return self;
        },

        /**
         * Unload and destroy all currently loaded Howl objects.
         * @return {Howler}
         */
        unload: function() {
          var self = this || Howler;

          for (var i=self._howls.length-1; i>=0; i--) {
            self._howls[i].unload();
          }

          // Create a new AudioContext to make sure it is fully reset.
          if (self.usingWebAudio && self.ctx && typeof self.ctx.close !== 'undefined') {
            self.ctx.close();
            self.ctx = null;
            setupAudioContext();
          }

          return self;
        },

        /**
         * Check for codec support of specific extension.
         * @param  {String} ext Audio file extention.
         * @return {Boolean}
         */
        codecs: function(ext) {
          return (this || Howler)._codecs[ext.replace(/^x-/, '')];
        },

        /**
         * Setup various state values for global tracking.
         * @return {Howler}
         */
        _setup: function() {
          var self = this || Howler;

          // Keeps track of the suspend/resume state of the AudioContext.
          self.state = self.ctx ? self.ctx.state || 'suspended' : 'suspended';

          // Automatically begin the 30-second suspend process
          self._autoSuspend();

          // Check if audio is available.
          if (!self.usingWebAudio) {
            // No audio is available on this system if noAudio is set to true.
            if (typeof Audio !== 'undefined') {
              try {
                var test = new Audio();

                // Check if the canplaythrough event is available.
                if (typeof test.oncanplaythrough === 'undefined') {
                  self._canPlayEvent = 'canplay';
                }
              } catch(e) {
                self.noAudio = true;
              }
            } else {
              self.noAudio = true;
            }
          }

          // Test to make sure audio isn't disabled in Internet Explorer.
          try {
            var test = new Audio();
            if (test.muted) {
              self.noAudio = true;
            }
          } catch (e) {}

          // Check for supported codecs.
          if (!self.noAudio) {
            self._setupCodecs();
          }

          return self;
        },

        /**
         * Check for browser support for various codecs and cache the results.
         * @return {Howler}
         */
        _setupCodecs: function() {
          var self = this || Howler;
          var audioTest = null;

          // Must wrap in a try/catch because IE11 in server mode throws an error.
          try {
            audioTest = (typeof Audio !== 'undefined') ? new Audio() : null;
          } catch (err) {
            return self;
          }

          if (!audioTest || typeof audioTest.canPlayType !== 'function') {
            return self;
          }

          var mpegTest = audioTest.canPlayType('audio/mpeg;').replace(/^no$/, '');

          // Opera version <33 has mixed MP3 support, so we need to check for and block it.
          var checkOpera = self._navigator && self._navigator.userAgent.match(/OPR\/([0-6].)/g);
          var isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33);

          self._codecs = {
            mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType('audio/mp3;').replace(/^no$/, ''))),
            mpeg: !!mpegTest,
            opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
            ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
            oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
            wav: !!(audioTest.canPlayType('audio/wav; codecs="1"') || audioTest.canPlayType('audio/wav')).replace(/^no$/, ''),
            aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
            caf: !!audioTest.canPlayType('audio/x-caf;').replace(/^no$/, ''),
            m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
            m4b: !!(audioTest.canPlayType('audio/x-m4b;') || audioTest.canPlayType('audio/m4b;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
            mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
            weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
            webm: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
            dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ''),
            flac: !!(audioTest.canPlayType('audio/x-flac;') || audioTest.canPlayType('audio/flac;')).replace(/^no$/, '')
          };

          return self;
        },

        /**
         * Some browsers/devices will only allow audio to be played after a user interaction.
         * Attempt to automatically unlock audio on the first user interaction.
         * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
         * @return {Howler}
         */
        _unlockAudio: function() {
          var self = this || Howler;

          // Only run this if Web Audio is supported and it hasn't already been unlocked.
          if (self._audioUnlocked || !self.ctx) {
            return;
          }

          self._audioUnlocked = false;
          self.autoUnlock = false;

          // Some mobile devices/platforms have distortion issues when opening/closing tabs and/or web views.
          // Bugs in the browser (especially Mobile Safari) can cause the sampleRate to change from 44100 to 48000.
          // By calling Howler.unload(), we create a new AudioContext with the correct sampleRate.
          if (!self._mobileUnloaded && self.ctx.sampleRate !== 44100) {
            self._mobileUnloaded = true;
            self.unload();
          }

          // Scratch buffer for enabling iOS to dispose of web audio buffers correctly, as per:
          // http://stackoverflow.com/questions/24119684
          self._scratchBuffer = self.ctx.createBuffer(1, 1, 22050);

          // Call this method on touch start to create and play a buffer,
          // then check if the audio actually played to determine if
          // audio has now been unlocked on iOS, Android, etc.
          var unlock = function(e) {
            // Create a pool of unlocked HTML5 Audio objects that can
            // be used for playing sounds without user interaction. HTML5
            // Audio objects must be individually unlocked, as opposed
            // to the WebAudio API which only needs a single activation.
            // This must occur before WebAudio setup or the source.onended
            // event will not fire.
            while (self._html5AudioPool.length < self.html5PoolSize) {
              try {
                var audioNode = new Audio();

                // Mark this Audio object as unlocked to ensure it can get returned
                // to the unlocked pool when released.
                audioNode._unlocked = true;

                // Add the audio node to the pool.
                self._releaseHtml5Audio(audioNode);
              } catch (e) {
                self.noAudio = true;
                break;
              }
            }

            // Loop through any assigned audio nodes and unlock them.
            for (var i=0; i<self._howls.length; i++) {
              if (!self._howls[i]._webAudio) {
                // Get all of the sounds in this Howl group.
                var ids = self._howls[i]._getSoundIds();

                // Loop through all sounds and unlock the audio nodes.
                for (var j=0; j<ids.length; j++) {
                  var sound = self._howls[i]._soundById(ids[j]);

                  if (sound && sound._node && !sound._node._unlocked) {
                    sound._node._unlocked = true;
                    sound._node.load();
                  }
                }
              }
            }

            // Fix Android can not play in suspend state.
            self._autoResume();

            // Create an empty buffer.
            var source = self.ctx.createBufferSource();
            source.buffer = self._scratchBuffer;
            source.connect(self.ctx.destination);

            // Play the empty buffer.
            if (typeof source.start === 'undefined') {
              source.noteOn(0);
            } else {
              source.start(0);
            }

            // Calling resume() on a stack initiated by user gesture is what actually unlocks the audio on Android Chrome >= 55.
            if (typeof self.ctx.resume === 'function') {
              self.ctx.resume();
            }

            // Setup a timeout to check that we are unlocked on the next event loop.
            source.onended = function() {
              source.disconnect(0);

              // Update the unlocked state and prevent this check from happening again.
              self._audioUnlocked = true;

              // Remove the touch start listener.
              document.removeEventListener('touchstart', unlock, true);
              document.removeEventListener('touchend', unlock, true);
              document.removeEventListener('click', unlock, true);

              // Let all sounds know that audio has been unlocked.
              for (var i=0; i<self._howls.length; i++) {
                self._howls[i]._emit('unlock');
              }
            };
          };

          // Setup a touch start listener to attempt an unlock in.
          document.addEventListener('touchstart', unlock, true);
          document.addEventListener('touchend', unlock, true);
          document.addEventListener('click', unlock, true);

          return self;
        },

        /**
         * Get an unlocked HTML5 Audio object from the pool. If none are left,
         * return a new Audio object and throw a warning.
         * @return {Audio} HTML5 Audio object.
         */
        _obtainHtml5Audio: function() {
          var self = this || Howler;

          // Return the next object from the pool if one exists.
          if (self._html5AudioPool.length) {
            return self._html5AudioPool.pop();
          }

          //.Check if the audio is locked and throw a warning.
          var testPlay = new Audio().play();
          if (testPlay && typeof Promise !== 'undefined' && (testPlay instanceof Promise || typeof testPlay.then === 'function')) {
            testPlay.catch(function() {
              console.warn('HTML5 Audio pool exhausted, returning potentially locked audio object.');
            });
          }

          return new Audio();
        },

        /**
         * Return an activated HTML5 Audio object to the pool.
         * @return {Howler}
         */
        _releaseHtml5Audio: function(audio) {
          var self = this || Howler;

          // Don't add audio to the pool if we don't know if it has been unlocked.
          if (audio._unlocked) {
            self._html5AudioPool.push(audio);
          }

          return self;
        },

        /**
         * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
         * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
         * @return {Howler}
         */
        _autoSuspend: function() {
          var self = this;

          if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === 'undefined' || !Howler.usingWebAudio) {
            return;
          }

          // Check if any sounds are playing.
          for (var i=0; i<self._howls.length; i++) {
            if (self._howls[i]._webAudio) {
              for (var j=0; j<self._howls[i]._sounds.length; j++) {
                if (!self._howls[i]._sounds[j]._paused) {
                  return self;
                }
              }
            }
          }

          if (self._suspendTimer) {
            clearTimeout(self._suspendTimer);
          }

          // If no sound has played after 30 seconds, suspend the context.
          self._suspendTimer = setTimeout(function() {
            if (!self.autoSuspend) {
              return;
            }

            self._suspendTimer = null;
            self.state = 'suspending';

            // Handle updating the state of the audio context after suspending.
            var handleSuspension = function() {
              self.state = 'suspended';

              if (self._resumeAfterSuspend) {
                delete self._resumeAfterSuspend;
                self._autoResume();
              }
            };

            // Either the state gets suspended or it is interrupted.
            // Either way, we need to update the state to suspended.
            self.ctx.suspend().then(handleSuspension, handleSuspension);
          }, 30000);

          return self;
        },

        /**
         * Automatically resume the Web Audio AudioContext when a new sound is played.
         * @return {Howler}
         */
        _autoResume: function() {
          var self = this;

          if (!self.ctx || typeof self.ctx.resume === 'undefined' || !Howler.usingWebAudio) {
            return;
          }

          if (self.state === 'running' && self.ctx.state !== 'interrupted' && self._suspendTimer) {
            clearTimeout(self._suspendTimer);
            self._suspendTimer = null;
          } else if (self.state === 'suspended' || self.state === 'running' && self.ctx.state === 'interrupted') {
            self.ctx.resume().then(function() {
              self.state = 'running';

              // Emit to all Howls that the audio has resumed.
              for (var i=0; i<self._howls.length; i++) {
                self._howls[i]._emit('resume');
              }
            });

            if (self._suspendTimer) {
              clearTimeout(self._suspendTimer);
              self._suspendTimer = null;
            }
          } else if (self.state === 'suspending') {
            self._resumeAfterSuspend = true;
          }

          return self;
        }
      };

      // Setup the global audio controller.
      var Howler = new HowlerGlobal();

      /** Group Methods **/
      /***************************************************************************/

      /**
       * Create an audio group controller.
       * @param {Object} o Passed in properties for this group.
       */
      var Howl = function(o) {
        var self = this;

        // Throw an error if no source is provided.
        if (!o.src || o.src.length === 0) {
          console.error('An array of source files must be passed with any new Howl.');
          return;
        }

        self.init(o);
      };
      Howl.prototype = {
        /**
         * Initialize a new Howl group object.
         * @param  {Object} o Passed in properties for this group.
         * @return {Howl}
         */
        init: function(o) {
          var self = this;

          // If we don't have an AudioContext created yet, run the setup.
          if (!Howler.ctx) {
            setupAudioContext();
          }

          // Setup user-defined default properties.
          self._autoplay = o.autoplay || false;
          self._format = (typeof o.format !== 'string') ? o.format : [o.format];
          self._html5 = o.html5 || false;
          self._muted = o.mute || false;
          self._loop = o.loop || false;
          self._pool = o.pool || 5;
          self._preload = (typeof o.preload === 'boolean' || o.preload === 'metadata') ? o.preload : true;
          self._rate = o.rate || 1;
          self._sprite = o.sprite || {};
          self._src = (typeof o.src !== 'string') ? o.src : [o.src];
          self._volume = o.volume !== undefined ? o.volume : 1;
          self._xhr = {
            method: o.xhr && o.xhr.method ? o.xhr.method : 'GET',
            headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
            withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : false,
          };

          // Setup all other default properties.
          self._duration = 0;
          self._state = 'unloaded';
          self._sounds = [];
          self._endTimers = {};
          self._queue = [];
          self._playLock = false;

          // Setup event listeners.
          self._onend = o.onend ? [{fn: o.onend}] : [];
          self._onfade = o.onfade ? [{fn: o.onfade}] : [];
          self._onload = o.onload ? [{fn: o.onload}] : [];
          self._onloaderror = o.onloaderror ? [{fn: o.onloaderror}] : [];
          self._onplayerror = o.onplayerror ? [{fn: o.onplayerror}] : [];
          self._onpause = o.onpause ? [{fn: o.onpause}] : [];
          self._onplay = o.onplay ? [{fn: o.onplay}] : [];
          self._onstop = o.onstop ? [{fn: o.onstop}] : [];
          self._onmute = o.onmute ? [{fn: o.onmute}] : [];
          self._onvolume = o.onvolume ? [{fn: o.onvolume}] : [];
          self._onrate = o.onrate ? [{fn: o.onrate}] : [];
          self._onseek = o.onseek ? [{fn: o.onseek}] : [];
          self._onunlock = o.onunlock ? [{fn: o.onunlock}] : [];
          self._onresume = [];

          // Web Audio or HTML5 Audio?
          self._webAudio = Howler.usingWebAudio && !self._html5;

          // Automatically try to enable audio.
          if (typeof Howler.ctx !== 'undefined' && Howler.ctx && Howler.autoUnlock) {
            Howler._unlockAudio();
          }

          // Keep track of this Howl group in the global controller.
          Howler._howls.push(self);

          // If they selected autoplay, add a play event to the load queue.
          if (self._autoplay) {
            self._queue.push({
              event: 'play',
              action: function() {
                self.play();
              }
            });
          }

          // Load the source file unless otherwise specified.
          if (self._preload && self._preload !== 'none') {
            self.load();
          }

          return self;
        },

        /**
         * Load the audio file.
         * @return {Howler}
         */
        load: function() {
          var self = this;
          var url = null;

          // If no audio is available, quit immediately.
          if (Howler.noAudio) {
            self._emit('loaderror', null, 'No audio support.');
            return;
          }

          // Make sure our source is in an array.
          if (typeof self._src === 'string') {
            self._src = [self._src];
          }

          // Loop through the sources and pick the first one that is compatible.
          for (var i=0; i<self._src.length; i++) {
            var ext, str;

            if (self._format && self._format[i]) {
              // If an extension was specified, use that instead.
              ext = self._format[i];
            } else {
              // Make sure the source is a string.
              str = self._src[i];
              if (typeof str !== 'string') {
                self._emit('loaderror', null, 'Non-string found in selected audio sources - ignoring.');
                continue;
              }

              // Extract the file extension from the URL or base64 data URI.
              ext = /^data:audio\/([^;,]+);/i.exec(str);
              if (!ext) {
                ext = /\.([^.]+)$/.exec(str.split('?', 1)[0]);
              }

              if (ext) {
                ext = ext[1].toLowerCase();
              }
            }

            // Log a warning if no extension was found.
            if (!ext) {
              console.warn('No file extension was found. Consider using the "format" property or specify an extension.');
            }

            // Check if this extension is available.
            if (ext && Howler.codecs(ext)) {
              url = self._src[i];
              break;
            }
          }

          if (!url) {
            self._emit('loaderror', null, 'No codec support for selected audio sources.');
            return;
          }

          self._src = url;
          self._state = 'loading';

          // If the hosting page is HTTPS and the source isn't,
          // drop down to HTML5 Audio to avoid Mixed Content errors.
          if (window.location.protocol === 'https:' && url.slice(0, 5) === 'http:') {
            self._html5 = true;
            self._webAudio = false;
          }

          // Create a new sound object and add it to the pool.
          new Sound(self);

          // Load and decode the audio data for playback.
          if (self._webAudio) {
            loadBuffer(self);
          }

          return self;
        },

        /**
         * Play a sound or resume previous playback.
         * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Number}          Sound ID.
         */
        play: function(sprite, internal) {
          var self = this;
          var id = null;

          // Determine if a sprite, sound id or nothing was passed
          if (typeof sprite === 'number') {
            id = sprite;
            sprite = null;
          } else if (typeof sprite === 'string' && self._state === 'loaded' && !self._sprite[sprite]) {
            // If the passed sprite doesn't exist, do nothing.
            return null;
          } else if (typeof sprite === 'undefined') {
            // Use the default sound sprite (plays the full audio length).
            sprite = '__default';

            // Check if there is a single paused sound that isn't ended.
            // If there is, play that sound. If not, continue as usual.
            if (!self._playLock) {
              var num = 0;
              for (var i=0; i<self._sounds.length; i++) {
                if (self._sounds[i]._paused && !self._sounds[i]._ended) {
                  num++;
                  id = self._sounds[i]._id;
                }
              }

              if (num === 1) {
                sprite = null;
              } else {
                id = null;
              }
            }
          }

          // Get the selected node, or get one from the pool.
          var sound = id ? self._soundById(id) : self._inactiveSound();

          // If the sound doesn't exist, do nothing.
          if (!sound) {
            return null;
          }

          // Select the sprite definition.
          if (id && !sprite) {
            sprite = sound._sprite || '__default';
          }

          // If the sound hasn't loaded, we must wait to get the audio's duration.
          // We also need to wait to make sure we don't run into race conditions with
          // the order of function calls.
          if (self._state !== 'loaded') {
            // Set the sprite value on this sound.
            sound._sprite = sprite;

            // Mark this sound as not ended in case another sound is played before this one loads.
            sound._ended = false;

            // Add the sound to the queue to be played on load.
            var soundId = sound._id;
            self._queue.push({
              event: 'play',
              action: function() {
                self.play(soundId);
              }
            });

            return soundId;
          }

          // Don't play the sound if an id was passed and it is already playing.
          if (id && !sound._paused) {
            // Trigger the play event, in order to keep iterating through queue.
            if (!internal) {
              self._loadQueue('play');
            }

            return sound._id;
          }

          // Make sure the AudioContext isn't suspended, and resume it if it is.
          if (self._webAudio) {
            Howler._autoResume();
          }

          // Determine how long to play for and where to start playing.
          var seek = Math.max(0, sound._seek > 0 ? sound._seek : self._sprite[sprite][0] / 1000);
          var duration = Math.max(0, ((self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000) - seek);
          var timeout = (duration * 1000) / Math.abs(sound._rate);
          var start = self._sprite[sprite][0] / 1000;
          var stop = (self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000;
          sound._sprite = sprite;

          // Mark the sound as ended instantly so that this async playback
          // doesn't get grabbed by another call to play while this one waits to start.
          sound._ended = false;

          // Update the parameters of the sound.
          var setParams = function() {
            sound._paused = false;
            sound._seek = seek;
            sound._start = start;
            sound._stop = stop;
            sound._loop = !!(sound._loop || self._sprite[sprite][2]);
          };

          // End the sound instantly if seek is at the end.
          if (seek >= stop) {
            self._ended(sound);
            return;
          }

          // Begin the actual playback.
          var node = sound._node;
          if (self._webAudio) {
            // Fire this when the sound is ready to play to begin Web Audio playback.
            var playWebAudio = function() {
              self._playLock = false;
              setParams();
              self._refreshBuffer(sound);

              // Setup the playback params.
              var vol = (sound._muted || self._muted) ? 0 : sound._volume;
              node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
              sound._playStart = Howler.ctx.currentTime;

              // Play the sound using the supported method.
              if (typeof node.bufferSource.start === 'undefined') {
                sound._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration);
              } else {
                sound._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration);
              }

              // Start a new timer if none is present.
              if (timeout !== Infinity) {
                self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
              }

              if (!internal) {
                setTimeout(function() {
                  self._emit('play', sound._id);
                  self._loadQueue();
                }, 0);
              }
            };

            if (Howler.state === 'running' && Howler.ctx.state !== 'interrupted') {
              playWebAudio();
            } else {
              self._playLock = true;

              // Wait for the audio context to resume before playing.
              self.once('resume', playWebAudio);

              // Cancel the end timer.
              self._clearTimer(sound._id);
            }
          } else {
            // Fire this when the sound is ready to play to begin HTML5 Audio playback.
            var playHtml5 = function() {
              node.currentTime = seek;
              node.muted = sound._muted || self._muted || Howler._muted || node.muted;
              node.volume = sound._volume * Howler.volume();
              node.playbackRate = sound._rate;

              // Some browsers will throw an error if this is called without user interaction.
              try {
                var play = node.play();

                // Support older browsers that don't support promises, and thus don't have this issue.
                if (play && typeof Promise !== 'undefined' && (play instanceof Promise || typeof play.then === 'function')) {
                  // Implements a lock to prevent DOMException: The play() request was interrupted by a call to pause().
                  self._playLock = true;

                  // Set param values immediately.
                  setParams();

                  // Releases the lock and executes queued actions.
                  play
                    .then(function() {
                      self._playLock = false;
                      node._unlocked = true;
                      if (!internal) {
                        self._emit('play', sound._id);
                        self._loadQueue();
                      }
                    })
                    .catch(function() {
                      self._playLock = false;
                      self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                        'on mobile devices and Chrome where playback was not within a user interaction.');

                      // Reset the ended and paused values.
                      sound._ended = true;
                      sound._paused = true;
                    });
                } else if (!internal) {
                  self._playLock = false;
                  setParams();
                  self._emit('play', sound._id);
                  self._loadQueue();
                }

                // Setting rate before playing won't work in IE, so we set it again here.
                node.playbackRate = sound._rate;

                // If the node is still paused, then we can assume there was a playback issue.
                if (node.paused) {
                  self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                    'on mobile devices and Chrome where playback was not within a user interaction.');
                  return;
                }

                // Setup the end timer on sprites or listen for the ended event.
                if (sprite !== '__default' || sound._loop) {
                  self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
                } else {
                  self._endTimers[sound._id] = function() {
                    // Fire ended on this audio node.
                    self._ended(sound);

                    // Clear this listener.
                    node.removeEventListener('ended', self._endTimers[sound._id], false);
                  };
                  node.addEventListener('ended', self._endTimers[sound._id], false);
                }
              } catch (err) {
                self._emit('playerror', sound._id, err);
              }
            };

            // If this is streaming audio, make sure the src is set and load again.
            if (node.src === 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA') {
              node.src = self._src;
              node.load();
            }

            // Play immediately if ready, or wait for the 'canplaythrough'e vent.
            var loadedNoReadyState = (window && window.ejecta) || (!node.readyState && Howler._navigator.isCocoonJS);
            if (node.readyState >= 3 || loadedNoReadyState) {
              playHtml5();
            } else {
              self._playLock = true;

              var listener = function() {
                // Begin playback.
                playHtml5();

                // Clear this listener.
                node.removeEventListener(Howler._canPlayEvent, listener, false);
              };
              node.addEventListener(Howler._canPlayEvent, listener, false);

              // Cancel the end timer.
              self._clearTimer(sound._id);
            }
          }

          return sound._id;
        },

        /**
         * Pause playback and save current position.
         * @param  {Number} id The sound ID (empty to pause all in group).
         * @return {Howl}
         */
        pause: function(id) {
          var self = this;

          // If the sound hasn't loaded or a play() promise is pending, add it to the load queue to pause when capable.
          if (self._state !== 'loaded' || self._playLock) {
            self._queue.push({
              event: 'pause',
              action: function() {
                self.pause(id);
              }
            });

            return self;
          }

          // If no id is passed, get all ID's to be paused.
          var ids = self._getSoundIds(id);

          for (var i=0; i<ids.length; i++) {
            // Clear the end timer.
            self._clearTimer(ids[i]);

            // Get the sound.
            var sound = self._soundById(ids[i]);

            if (sound && !sound._paused) {
              // Reset the seek position.
              sound._seek = self.seek(ids[i]);
              sound._rateSeek = 0;
              sound._paused = true;

              // Stop currently running fades.
              self._stopFade(ids[i]);

              if (sound._node) {
                if (self._webAudio) {
                  // Make sure the sound has been created.
                  if (!sound._node.bufferSource) {
                    continue;
                  }

                  if (typeof sound._node.bufferSource.stop === 'undefined') {
                    sound._node.bufferSource.noteOff(0);
                  } else {
                    sound._node.bufferSource.stop(0);
                  }

                  // Clean up the buffer source.
                  self._cleanBuffer(sound._node);
                } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
                  sound._node.pause();
                }
              }
            }

            // Fire the pause event, unless `true` is passed as the 2nd argument.
            if (!arguments[1]) {
              self._emit('pause', sound ? sound._id : null);
            }
          }

          return self;
        },

        /**
         * Stop playback and reset to start.
         * @param  {Number} id The sound ID (empty to stop all in group).
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Howl}
         */
        stop: function(id, internal) {
          var self = this;

          // If the sound hasn't loaded, add it to the load queue to stop when capable.
          if (self._state !== 'loaded' || self._playLock) {
            self._queue.push({
              event: 'stop',
              action: function() {
                self.stop(id);
              }
            });

            return self;
          }

          // If no id is passed, get all ID's to be stopped.
          var ids = self._getSoundIds(id);

          for (var i=0; i<ids.length; i++) {
            // Clear the end timer.
            self._clearTimer(ids[i]);

            // Get the sound.
            var sound = self._soundById(ids[i]);

            if (sound) {
              // Reset the seek position.
              sound._seek = sound._start || 0;
              sound._rateSeek = 0;
              sound._paused = true;
              sound._ended = true;

              // Stop currently running fades.
              self._stopFade(ids[i]);

              if (sound._node) {
                if (self._webAudio) {
                  // Make sure the sound's AudioBufferSourceNode has been created.
                  if (sound._node.bufferSource) {
                    if (typeof sound._node.bufferSource.stop === 'undefined') {
                      sound._node.bufferSource.noteOff(0);
                    } else {
                      sound._node.bufferSource.stop(0);
                    }

                    // Clean up the buffer source.
                    self._cleanBuffer(sound._node);
                  }
                } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
                  sound._node.currentTime = sound._start || 0;
                  sound._node.pause();

                  // If this is a live stream, stop download once the audio is stopped.
                  if (sound._node.duration === Infinity) {
                    self._clearSound(sound._node);
                  }
                }
              }

              if (!internal) {
                self._emit('stop', sound._id);
              }
            }
          }

          return self;
        },

        /**
         * Mute/unmute a single sound or all sounds in this Howl group.
         * @param  {Boolean} muted Set to true to mute and false to unmute.
         * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
         * @return {Howl}
         */
        mute: function(muted, id) {
          var self = this;

          // If the sound hasn't loaded, add it to the load queue to mute when capable.
          if (self._state !== 'loaded'|| self._playLock) {
            self._queue.push({
              event: 'mute',
              action: function() {
                self.mute(muted, id);
              }
            });

            return self;
          }

          // If applying mute/unmute to all sounds, update the group's value.
          if (typeof id === 'undefined') {
            if (typeof muted === 'boolean') {
              self._muted = muted;
            } else {
              return self._muted;
            }
          }

          // If no id is passed, get all ID's to be muted.
          var ids = self._getSoundIds(id);

          for (var i=0; i<ids.length; i++) {
            // Get the sound.
            var sound = self._soundById(ids[i]);

            if (sound) {
              sound._muted = muted;

              // Cancel active fade and set the volume to the end value.
              if (sound._interval) {
                self._stopFade(sound._id);
              }

              if (self._webAudio && sound._node) {
                sound._node.gain.setValueAtTime(muted ? 0 : sound._volume, Howler.ctx.currentTime);
              } else if (sound._node) {
                sound._node.muted = Howler._muted ? true : muted;
              }

              self._emit('mute', sound._id);
            }
          }

          return self;
        },

        /**
         * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
         *   volume() -> Returns the group's volume value.
         *   volume(id) -> Returns the sound id's current volume.
         *   volume(vol) -> Sets the volume of all sounds in this Howl group.
         *   volume(vol, id) -> Sets the volume of passed sound id.
         * @return {Howl/Number} Returns self or current volume.
         */
        volume: function() {
          var self = this;
          var args = arguments;
          var vol, id;

          // Determine the values based on arguments.
          if (args.length === 0) {
            // Return the value of the groups' volume.
            return self._volume;
          } else if (args.length === 1 || args.length === 2 && typeof args[1] === 'undefined') {
            // First check if this is an ID, and if not, assume it is a new volume.
            var ids = self._getSoundIds();
            var index = ids.indexOf(args[0]);
            if (index >= 0) {
              id = parseInt(args[0], 10);
            } else {
              vol = parseFloat(args[0]);
            }
          } else if (args.length >= 2) {
            vol = parseFloat(args[0]);
            id = parseInt(args[1], 10);
          }

          // Update the volume or return the current volume.
          var sound;
          if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
            // If the sound hasn't loaded, add it to the load queue to change volume when capable.
            if (self._state !== 'loaded'|| self._playLock) {
              self._queue.push({
                event: 'volume',
                action: function() {
                  self.volume.apply(self, args);
                }
              });

              return self;
            }

            // Set the group volume.
            if (typeof id === 'undefined') {
              self._volume = vol;
            }

            // Update one or all volumes.
            id = self._getSoundIds(id);
            for (var i=0; i<id.length; i++) {
              // Get the sound.
              sound = self._soundById(id[i]);

              if (sound) {
                sound._volume = vol;

                // Stop currently running fades.
                if (!args[2]) {
                  self._stopFade(id[i]);
                }

                if (self._webAudio && sound._node && !sound._muted) {
                  sound._node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
                } else if (sound._node && !sound._muted) {
                  sound._node.volume = vol * Howler.volume();
                }

                self._emit('volume', sound._id);
              }
            }
          } else {
            sound = id ? self._soundById(id) : self._sounds[0];
            return sound ? sound._volume : 0;
          }

          return self;
        },

        /**
         * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id (omit to fade all sounds).
         * @return {Howl}
         */
        fade: function(from, to, len, id) {
          var self = this;

          // If the sound hasn't loaded, add it to the load queue to fade when capable.
          if (self._state !== 'loaded' || self._playLock) {
            self._queue.push({
              event: 'fade',
              action: function() {
                self.fade(from, to, len, id);
              }
            });

            return self;
          }

          // Make sure the to/from/len values are numbers.
          from = Math.min(Math.max(0, parseFloat(from)), 1);
          to = Math.min(Math.max(0, parseFloat(to)), 1);
          len = parseFloat(len);

          // Set the volume to the start position.
          self.volume(from, id);

          // Fade the volume of one or all sounds.
          var ids = self._getSoundIds(id);
          for (var i=0; i<ids.length; i++) {
            // Get the sound.
            var sound = self._soundById(ids[i]);

            // Create a linear fade or fall back to timeouts with HTML5 Audio.
            if (sound) {
              // Stop the previous fade if no sprite is being used (otherwise, volume handles this).
              if (!id) {
                self._stopFade(ids[i]);
              }

              // If we are using Web Audio, let the native methods do the actual fade.
              if (self._webAudio && !sound._muted) {
                var currentTime = Howler.ctx.currentTime;
                var end = currentTime + (len / 1000);
                sound._volume = from;
                sound._node.gain.setValueAtTime(from, currentTime);
                sound._node.gain.linearRampToValueAtTime(to, end);
              }

              self._startFadeInterval(sound, from, to, len, ids[i], typeof id === 'undefined');
            }
          }

          return self;
        },

        /**
         * Starts the internal interval to fade a sound.
         * @param  {Object} sound Reference to sound to fade.
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id to fade.
         * @param  {Boolean} isGroup   If true, set the volume on the group.
         */
        _startFadeInterval: function(sound, from, to, len, id, isGroup) {
          var self = this;
          var vol = from;
          var diff = to - from;
          var steps = Math.abs(diff / 0.01);
          var stepLen = Math.max(4, (steps > 0) ? len / steps : len);
          var lastTick = Date.now();

          // Store the value being faded to.
          sound._fadeTo = to;

          // Update the volume value on each interval tick.
          sound._interval = setInterval(function() {
            // Update the volume based on the time since the last tick.
            var tick = (Date.now() - lastTick) / len;
            lastTick = Date.now();
            vol += diff * tick;

            // Round to within 2 decimal points.
            vol = Math.round(vol * 100) / 100;

            // Make sure the volume is in the right bounds.
            if (diff < 0) {
              vol = Math.max(to, vol);
            } else {
              vol = Math.min(to, vol);
            }

            // Change the volume.
            if (self._webAudio) {
              sound._volume = vol;
            } else {
              self.volume(vol, sound._id, true);
            }

            // Set the group's volume.
            if (isGroup) {
              self._volume = vol;
            }

            // When the fade is complete, stop it and fire event.
            if ((to < from && vol <= to) || (to > from && vol >= to)) {
              clearInterval(sound._interval);
              sound._interval = null;
              sound._fadeTo = null;
              self.volume(to, sound._id);
              self._emit('fade', sound._id);
            }
          }, stepLen);
        },

        /**
         * Internal method that stops the currently playing fade when
         * a new fade starts, volume is changed or the sound is stopped.
         * @param  {Number} id The sound id.
         * @return {Howl}
         */
        _stopFade: function(id) {
          var self = this;
          var sound = self._soundById(id);

          if (sound && sound._interval) {
            if (self._webAudio) {
              sound._node.gain.cancelScheduledValues(Howler.ctx.currentTime);
            }

            clearInterval(sound._interval);
            sound._interval = null;
            self.volume(sound._fadeTo, id);
            sound._fadeTo = null;
            self._emit('fade', id);
          }

          return self;
        },

        /**
         * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
         *   loop() -> Returns the group's loop value.
         *   loop(id) -> Returns the sound id's loop value.
         *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
         *   loop(loop, id) -> Sets the loop value of passed sound id.
         * @return {Howl/Boolean} Returns self or current loop value.
         */
        loop: function() {
          var self = this;
          var args = arguments;
          var loop, id, sound;

          // Determine the values for loop and id.
          if (args.length === 0) {
            // Return the grou's loop value.
            return self._loop;
          } else if (args.length === 1) {
            if (typeof args[0] === 'boolean') {
              loop = args[0];
              self._loop = loop;
            } else {
              // Return this sound's loop value.
              sound = self._soundById(parseInt(args[0], 10));
              return sound ? sound._loop : false;
            }
          } else if (args.length === 2) {
            loop = args[0];
            id = parseInt(args[1], 10);
          }

          // If no id is passed, get all ID's to be looped.
          var ids = self._getSoundIds(id);
          for (var i=0; i<ids.length; i++) {
            sound = self._soundById(ids[i]);

            if (sound) {
              sound._loop = loop;
              if (self._webAudio && sound._node && sound._node.bufferSource) {
                sound._node.bufferSource.loop = loop;
                if (loop) {
                  sound._node.bufferSource.loopStart = sound._start || 0;
                  sound._node.bufferSource.loopEnd = sound._stop;
                }
              }
            }
          }

          return self;
        },

        /**
         * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   rate() -> Returns the first sound node's current playback rate.
         *   rate(id) -> Returns the sound id's current playback rate.
         *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
         *   rate(rate, id) -> Sets the playback rate of passed sound id.
         * @return {Howl/Number} Returns self or the current playback rate.
         */
        rate: function() {
          var self = this;
          var args = arguments;
          var rate, id;

          // Determine the values based on arguments.
          if (args.length === 0) {
            // We will simply return the current rate of the first node.
            id = self._sounds[0]._id;
          } else if (args.length === 1) {
            // First check if this is an ID, and if not, assume it is a new rate value.
            var ids = self._getSoundIds();
            var index = ids.indexOf(args[0]);
            if (index >= 0) {
              id = parseInt(args[0], 10);
            } else {
              rate = parseFloat(args[0]);
            }
          } else if (args.length === 2) {
            rate = parseFloat(args[0]);
            id = parseInt(args[1], 10);
          }

          // Update the playback rate or return the current value.
          var sound;
          if (typeof rate === 'number') {
            // If the sound hasn't loaded, add it to the load queue to change playback rate when capable.
            if (self._state !== 'loaded' || self._playLock) {
              self._queue.push({
                event: 'rate',
                action: function() {
                  self.rate.apply(self, args);
                }
              });

              return self;
            }

            // Set the group rate.
            if (typeof id === 'undefined') {
              self._rate = rate;
            }

            // Update one or all volumes.
            id = self._getSoundIds(id);
            for (var i=0; i<id.length; i++) {
              // Get the sound.
              sound = self._soundById(id[i]);

              if (sound) {
                // Keep track of our position when the rate changed and update the playback
                // start position so we can properly adjust the seek position for time elapsed.
                if (self.playing(id[i])) {
                  sound._rateSeek = self.seek(id[i]);
                  sound._playStart = self._webAudio ? Howler.ctx.currentTime : sound._playStart;
                }
                sound._rate = rate;

                // Change the playback rate.
                if (self._webAudio && sound._node && sound._node.bufferSource) {
                  sound._node.bufferSource.playbackRate.setValueAtTime(rate, Howler.ctx.currentTime);
                } else if (sound._node) {
                  sound._node.playbackRate = rate;
                }

                // Reset the timers.
                var seek = self.seek(id[i]);
                var duration = ((self._sprite[sound._sprite][0] + self._sprite[sound._sprite][1]) / 1000) - seek;
                var timeout = (duration * 1000) / Math.abs(sound._rate);

                // Start a new end timer if sound is already playing.
                if (self._endTimers[id[i]] || !sound._paused) {
                  self._clearTimer(id[i]);
                  self._endTimers[id[i]] = setTimeout(self._ended.bind(self, sound), timeout);
                }

                self._emit('rate', sound._id);
              }
            }
          } else {
            sound = self._soundById(id);
            return sound ? sound._rate : self._rate;
          }

          return self;
        },

        /**
         * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   seek() -> Returns the first sound node's current seek position.
         *   seek(id) -> Returns the sound id's current seek position.
         *   seek(seek) -> Sets the seek position of the first sound node.
         *   seek(seek, id) -> Sets the seek position of passed sound id.
         * @return {Howl/Number} Returns self or the current seek position.
         */
        seek: function() {
          var self = this;
          var args = arguments;
          var seek, id;

          // Determine the values based on arguments.
          if (args.length === 0) {
            // We will simply return the current position of the first node.
            id = self._sounds[0]._id;
          } else if (args.length === 1) {
            // First check if this is an ID, and if not, assume it is a new seek position.
            var ids = self._getSoundIds();
            var index = ids.indexOf(args[0]);
            if (index >= 0) {
              id = parseInt(args[0], 10);
            } else if (self._sounds.length) {
              id = self._sounds[0]._id;
              seek = parseFloat(args[0]);
            }
          } else if (args.length === 2) {
            seek = parseFloat(args[0]);
            id = parseInt(args[1], 10);
          }

          // If there is no ID, bail out.
          if (typeof id === 'undefined') {
            return self;
          }

          // If the sound hasn't loaded, add it to the load queue to seek when capable.
          if (typeof seek === 'number' && (self._state !== 'loaded' || self._playLock)) {
            self._queue.push({
              event: 'seek',
              action: function() {
                self.seek.apply(self, args);
              }
            });

            return self;
          }

          // Get the sound.
          var sound = self._soundById(id);

          if (sound) {
            if (typeof seek === 'number' && seek >= 0) {
              // Pause the sound and update position for restarting playback.
              var playing = self.playing(id);
              if (playing) {
                self.pause(id, true);
              }

              // Move the position of the track and cancel timer.
              sound._seek = seek;
              sound._ended = false;
              self._clearTimer(id);

              // Update the seek position for HTML5 Audio.
              if (!self._webAudio && sound._node && !isNaN(sound._node.duration)) {
                sound._node.currentTime = seek;
              }

              // Seek and emit when ready.
              var seekAndEmit = function() {
                self._emit('seek', id);

                // Restart the playback if the sound was playing.
                if (playing) {
                  self.play(id, true);
                }
              };

              // Wait for the play lock to be unset before emitting (HTML5 Audio).
              if (playing && !self._webAudio) {
                var emitSeek = function() {
                  if (!self._playLock) {
                    seekAndEmit();
                  } else {
                    setTimeout(emitSeek, 0);
                  }
                };
                setTimeout(emitSeek, 0);
              } else {
                seekAndEmit();
              }
            } else {
              if (self._webAudio) {
                var realTime = self.playing(id) ? Howler.ctx.currentTime - sound._playStart : 0;
                var rateSeek = sound._rateSeek ? sound._rateSeek - sound._seek : 0;
                return sound._seek + (rateSeek + realTime * Math.abs(sound._rate));
              } else {
                return sound._node.currentTime;
              }
            }
          }

          return self;
        },

        /**
         * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
         * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
         * @return {Boolean} True if playing and false if not.
         */
        playing: function(id) {
          var self = this;

          // Check the passed sound ID (if any).
          if (typeof id === 'number') {
            var sound = self._soundById(id);
            return sound ? !sound._paused : false;
          }

          // Otherwise, loop through all sounds and check if any are playing.
          for (var i=0; i<self._sounds.length; i++) {
            if (!self._sounds[i]._paused) {
              return true;
            }
          }

          return false;
        },

        /**
         * Get the duration of this sound. Passing a sound id will return the sprite duration.
         * @param  {Number} id The sound id to check. If none is passed, return full source duration.
         * @return {Number} Audio duration in seconds.
         */
        duration: function(id) {
          var self = this;
          var duration = self._duration;

          // If we pass an ID, get the sound and return the sprite length.
          var sound = self._soundById(id);
          if (sound) {
            duration = self._sprite[sound._sprite][1] / 1000;
          }

          return duration;
        },

        /**
         * Returns the current loaded state of this Howl.
         * @return {String} 'unloaded', 'loading', 'loaded'
         */
        state: function() {
          return this._state;
        },

        /**
         * Unload and destroy the current Howl object.
         * This will immediately stop all sound instances attached to this group.
         */
        unload: function() {
          var self = this;

          // Stop playing any active sounds.
          var sounds = self._sounds;
          for (var i=0; i<sounds.length; i++) {
            // Stop the sound if it is currently playing.
            if (!sounds[i]._paused) {
              self.stop(sounds[i]._id);
            }

            // Remove the source or disconnect.
            if (!self._webAudio) {
              // Set the source to 0-second silence to stop any downloading (except in IE).
              self._clearSound(sounds[i]._node);

              // Remove any event listeners.
              sounds[i]._node.removeEventListener('error', sounds[i]._errorFn, false);
              sounds[i]._node.removeEventListener(Howler._canPlayEvent, sounds[i]._loadFn, false);
              sounds[i]._node.removeEventListener('ended', sounds[i]._endFn, false);

              // Release the Audio object back to the pool.
              Howler._releaseHtml5Audio(sounds[i]._node);
            }

            // Empty out all of the nodes.
            delete sounds[i]._node;

            // Make sure all timers are cleared out.
            self._clearTimer(sounds[i]._id);
          }

          // Remove the references in the global Howler object.
          var index = Howler._howls.indexOf(self);
          if (index >= 0) {
            Howler._howls.splice(index, 1);
          }

          // Delete this sound from the cache (if no other Howl is using it).
          var remCache = true;
          for (i=0; i<Howler._howls.length; i++) {
            if (Howler._howls[i]._src === self._src || self._src.indexOf(Howler._howls[i]._src) >= 0) {
              remCache = false;
              break;
            }
          }

          if (cache && remCache) {
            delete cache[self._src];
          }

          // Clear global errors.
          Howler.noAudio = false;

          // Clear out `self`.
          self._state = 'unloaded';
          self._sounds = [];
          self = null;

          return null;
        },

        /**
         * Listen to a custom event.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
         * @return {Howl}
         */
        on: function(event, fn, id, once) {
          var self = this;
          var events = self['_on' + event];

          if (typeof fn === 'function') {
            events.push(once ? {id: id, fn: fn, once: once} : {id: id, fn: fn});
          }

          return self;
        },

        /**
         * Remove a custom event. Call without parameters to remove all events.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to remove. Leave empty to remove all.
         * @param  {Number}   id    (optional) Only remove events for this sound.
         * @return {Howl}
         */
        off: function(event, fn, id) {
          var self = this;
          var events = self['_on' + event];
          var i = 0;

          // Allow passing just an event and ID.
          if (typeof fn === 'number') {
            id = fn;
            fn = null;
          }

          if (fn || id) {
            // Loop through event store and remove the passed function.
            for (i=0; i<events.length; i++) {
              var isId = (id === events[i].id);
              if (fn === events[i].fn && isId || !fn && isId) {
                events.splice(i, 1);
                break;
              }
            }
          } else if (event) {
            // Clear out all events of this type.
            self['_on' + event] = [];
          } else {
            // Clear out all events of every type.
            var keys = Object.keys(self);
            for (i=0; i<keys.length; i++) {
              if ((keys[i].indexOf('_on') === 0) && Array.isArray(self[keys[i]])) {
                self[keys[i]] = [];
              }
            }
          }

          return self;
        },

        /**
         * Listen to a custom event and remove it once fired.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @return {Howl}
         */
        once: function(event, fn, id) {
          var self = this;

          // Setup the event listener.
          self.on(event, fn, id, 1);

          return self;
        },

        /**
         * Emit all events of a specific type and pass the sound id.
         * @param  {String} event Event name.
         * @param  {Number} id    Sound ID.
         * @param  {Number} msg   Message to go with event.
         * @return {Howl}
         */
        _emit: function(event, id, msg) {
          var self = this;
          var events = self['_on' + event];

          // Loop through event store and fire all functions.
          for (var i=events.length-1; i>=0; i--) {
            // Only fire the listener if the correct ID is used.
            if (!events[i].id || events[i].id === id || event === 'load') {
              setTimeout(function(fn) {
                fn.call(this, id, msg);
              }.bind(self, events[i].fn), 0);

              // If this event was setup with `once`, remove it.
              if (events[i].once) {
                self.off(event, events[i].fn, events[i].id);
              }
            }
          }

          // Pass the event type into load queue so that it can continue stepping.
          self._loadQueue(event);

          return self;
        },

        /**
         * Queue of actions initiated before the sound has loaded.
         * These will be called in sequence, with the next only firing
         * after the previous has finished executing (even if async like play).
         * @return {Howl}
         */
        _loadQueue: function(event) {
          var self = this;

          if (self._queue.length > 0) {
            var task = self._queue[0];

            // Remove this task if a matching event was passed.
            if (task.event === event) {
              self._queue.shift();
              self._loadQueue();
            }

            // Run the task if no event type is passed.
            if (!event) {
              task.action();
            }
          }

          return self;
        },

        /**
         * Fired when playback ends at the end of the duration.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _ended: function(sound) {
          var self = this;
          var sprite = sound._sprite;

          // If we are using IE and there was network latency we may be clipping
          // audio before it completes playing. Lets check the node to make sure it
          // believes it has completed, before ending the playback.
          if (!self._webAudio && sound._node && !sound._node.paused && !sound._node.ended && sound._node.currentTime < sound._stop) {
            setTimeout(self._ended.bind(self, sound), 100);
            return self;
          }

          // Should this sound loop?
          var loop = !!(sound._loop || self._sprite[sprite][2]);

          // Fire the ended event.
          self._emit('end', sound._id);

          // Restart the playback for HTML5 Audio loop.
          if (!self._webAudio && loop) {
            self.stop(sound._id, true).play(sound._id);
          }

          // Restart this timer if on a Web Audio loop.
          if (self._webAudio && loop) {
            self._emit('play', sound._id);
            sound._seek = sound._start || 0;
            sound._rateSeek = 0;
            sound._playStart = Howler.ctx.currentTime;

            var timeout = ((sound._stop - sound._start) * 1000) / Math.abs(sound._rate);
            self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
          }

          // Mark the node as paused.
          if (self._webAudio && !loop) {
            sound._paused = true;
            sound._ended = true;
            sound._seek = sound._start || 0;
            sound._rateSeek = 0;
            self._clearTimer(sound._id);

            // Clean up the buffer source.
            self._cleanBuffer(sound._node);

            // Attempt to auto-suspend AudioContext if no sounds are still playing.
            Howler._autoSuspend();
          }

          // When using a sprite, end the track.
          if (!self._webAudio && !loop) {
            self.stop(sound._id, true);
          }

          return self;
        },

        /**
         * Clear the end timer for a sound playback.
         * @param  {Number} id The sound ID.
         * @return {Howl}
         */
        _clearTimer: function(id) {
          var self = this;

          if (self._endTimers[id]) {
            // Clear the timeout or remove the ended listener.
            if (typeof self._endTimers[id] !== 'function') {
              clearTimeout(self._endTimers[id]);
            } else {
              var sound = self._soundById(id);
              if (sound && sound._node) {
                sound._node.removeEventListener('ended', self._endTimers[id], false);
              }
            }

            delete self._endTimers[id];
          }

          return self;
        },

        /**
         * Return the sound identified by this ID, or return null.
         * @param  {Number} id Sound ID
         * @return {Object}    Sound object or null.
         */
        _soundById: function(id) {
          var self = this;

          // Loop through all sounds and find the one with this ID.
          for (var i=0; i<self._sounds.length; i++) {
            if (id === self._sounds[i]._id) {
              return self._sounds[i];
            }
          }

          return null;
        },

        /**
         * Return an inactive sound from the pool or create a new one.
         * @return {Sound} Sound playback object.
         */
        _inactiveSound: function() {
          var self = this;

          self._drain();

          // Find the first inactive node to recycle.
          for (var i=0; i<self._sounds.length; i++) {
            if (self._sounds[i]._ended) {
              return self._sounds[i].reset();
            }
          }

          // If no inactive node was found, create a new one.
          return new Sound(self);
        },

        /**
         * Drain excess inactive sounds from the pool.
         */
        _drain: function() {
          var self = this;
          var limit = self._pool;
          var cnt = 0;
          var i = 0;

          // If there are less sounds than the max pool size, we are done.
          if (self._sounds.length < limit) {
            return;
          }

          // Count the number of inactive sounds.
          for (i=0; i<self._sounds.length; i++) {
            if (self._sounds[i]._ended) {
              cnt++;
            }
          }

          // Remove excess inactive sounds, going in reverse order.
          for (i=self._sounds.length - 1; i>=0; i--) {
            if (cnt <= limit) {
              return;
            }

            if (self._sounds[i]._ended) {
              // Disconnect the audio source when using Web Audio.
              if (self._webAudio && self._sounds[i]._node) {
                self._sounds[i]._node.disconnect(0);
              }

              // Remove sounds until we have the pool size.
              self._sounds.splice(i, 1);
              cnt--;
            }
          }
        },

        /**
         * Get all ID's from the sounds pool.
         * @param  {Number} id Only return one ID if one is passed.
         * @return {Array}    Array of IDs.
         */
        _getSoundIds: function(id) {
          var self = this;

          if (typeof id === 'undefined') {
            var ids = [];
            for (var i=0; i<self._sounds.length; i++) {
              ids.push(self._sounds[i]._id);
            }

            return ids;
          } else {
            return [id];
          }
        },

        /**
         * Load the sound back into the buffer source.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _refreshBuffer: function(sound) {
          var self = this;

          // Setup the buffer source for playback.
          sound._node.bufferSource = Howler.ctx.createBufferSource();
          sound._node.bufferSource.buffer = cache[self._src];

          // Connect to the correct node.
          if (sound._panner) {
            sound._node.bufferSource.connect(sound._panner);
          } else {
            sound._node.bufferSource.connect(sound._node);
          }

          // Setup looping and playback rate.
          sound._node.bufferSource.loop = sound._loop;
          if (sound._loop) {
            sound._node.bufferSource.loopStart = sound._start || 0;
            sound._node.bufferSource.loopEnd = sound._stop || 0;
          }
          sound._node.bufferSource.playbackRate.setValueAtTime(sound._rate, Howler.ctx.currentTime);

          return self;
        },

        /**
         * Prevent memory leaks by cleaning up the buffer source after playback.
         * @param  {Object} node Sound's audio node containing the buffer source.
         * @return {Howl}
         */
        _cleanBuffer: function(node) {
          var self = this;
          var isIOS = Howler._navigator && Howler._navigator.vendor.indexOf('Apple') >= 0;

          if (Howler._scratchBuffer && node.bufferSource) {
            node.bufferSource.onended = null;
            node.bufferSource.disconnect(0);
            if (isIOS) {
              try { node.bufferSource.buffer = Howler._scratchBuffer; } catch(e) {}
            }
          }
          node.bufferSource = null;

          return self;
        },

        /**
         * Set the source to a 0-second silence to stop any downloading (except in IE).
         * @param  {Object} node Audio node to clear.
         */
        _clearSound: function(node) {
          var checkIE = /MSIE |Trident\//.test(Howler._navigator && Howler._navigator.userAgent);
          if (!checkIE) {
            node.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          }
        }
      };

      /** Single Sound Methods **/
      /***************************************************************************/

      /**
       * Setup the sound object, which each node attached to a Howl group is contained in.
       * @param {Object} howl The Howl parent group.
       */
      var Sound = function(howl) {
        this._parent = howl;
        this.init();
      };
      Sound.prototype = {
        /**
         * Initialize a new Sound object.
         * @return {Sound}
         */
        init: function() {
          var self = this;
          var parent = self._parent;

          // Setup the default parameters.
          self._muted = parent._muted;
          self._loop = parent._loop;
          self._volume = parent._volume;
          self._rate = parent._rate;
          self._seek = 0;
          self._paused = true;
          self._ended = true;
          self._sprite = '__default';

          // Generate a unique ID for this sound.
          self._id = ++Howler._counter;

          // Add itself to the parent's pool.
          parent._sounds.push(self);

          // Create the new node.
          self.create();

          return self;
        },

        /**
         * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
         * @return {Sound}
         */
        create: function() {
          var self = this;
          var parent = self._parent;
          var volume = (Howler._muted || self._muted || self._parent._muted) ? 0 : self._volume;

          if (parent._webAudio) {
            // Create the gain node for controlling volume (the source will connect to this).
            self._node = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
            self._node.gain.setValueAtTime(volume, Howler.ctx.currentTime);
            self._node.paused = true;
            self._node.connect(Howler.masterGain);
          } else if (!Howler.noAudio) {
            // Get an unlocked Audio object from the pool.
            self._node = Howler._obtainHtml5Audio();

            // Listen for errors (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror).
            self._errorFn = self._errorListener.bind(self);
            self._node.addEventListener('error', self._errorFn, false);

            // Listen for 'canplaythrough' event to let us know the sound is ready.
            self._loadFn = self._loadListener.bind(self);
            self._node.addEventListener(Howler._canPlayEvent, self._loadFn, false);

            // Listen for the 'ended' event on the sound to account for edge-case where
            // a finite sound has a duration of Infinity.
            self._endFn = self._endListener.bind(self);
            self._node.addEventListener('ended', self._endFn, false);

            // Setup the new audio node.
            self._node.src = parent._src;
            self._node.preload = parent._preload === true ? 'auto' : parent._preload;
            self._node.volume = volume * Howler.volume();

            // Begin loading the source.
            self._node.load();
          }

          return self;
        },

        /**
         * Reset the parameters of this sound to the original state (for recycle).
         * @return {Sound}
         */
        reset: function() {
          var self = this;
          var parent = self._parent;

          // Reset all of the parameters of this sound.
          self._muted = parent._muted;
          self._loop = parent._loop;
          self._volume = parent._volume;
          self._rate = parent._rate;
          self._seek = 0;
          self._rateSeek = 0;
          self._paused = true;
          self._ended = true;
          self._sprite = '__default';

          // Generate a new ID so that it isn't confused with the previous sound.
          self._id = ++Howler._counter;

          return self;
        },

        /**
         * HTML5 Audio error listener callback.
         */
        _errorListener: function() {
          var self = this;

          // Fire an error event and pass back the code.
          self._parent._emit('loaderror', self._id, self._node.error ? self._node.error.code : 0);

          // Clear the event listener.
          self._node.removeEventListener('error', self._errorFn, false);
        },

        /**
         * HTML5 Audio canplaythrough listener callback.
         */
        _loadListener: function() {
          var self = this;
          var parent = self._parent;

          // Round up the duration to account for the lower precision in HTML5 Audio.
          parent._duration = Math.ceil(self._node.duration * 10) / 10;

          // Setup a sprite if none is defined.
          if (Object.keys(parent._sprite).length === 0) {
            parent._sprite = {__default: [0, parent._duration * 1000]};
          }

          if (parent._state !== 'loaded') {
            parent._state = 'loaded';
            parent._emit('load');
            parent._loadQueue();
          }

          // Clear the event listener.
          self._node.removeEventListener(Howler._canPlayEvent, self._loadFn, false);
        },

        /**
         * HTML5 Audio ended listener callback.
         */
        _endListener: function() {
          var self = this;
          var parent = self._parent;

          // Only handle the `ended`` event if the duration is Infinity.
          if (parent._duration === Infinity) {
            // Update the parent duration to match the real audio duration.
            // Round up the duration to account for the lower precision in HTML5 Audio.
            parent._duration = Math.ceil(self._node.duration * 10) / 10;

            // Update the sprite that corresponds to the real duration.
            if (parent._sprite.__default[1] === Infinity) {
              parent._sprite.__default[1] = parent._duration * 1000;
            }

            // Run the regular ended method.
            parent._ended(self);
          }

          // Clear the event listener since the duration is now correct.
          self._node.removeEventListener('ended', self._endFn, false);
        }
      };

      /** Helper Methods **/
      /***************************************************************************/

      var cache = {};

      /**
       * Buffer a sound from URL, Data URI or cache and decode to audio source (Web Audio API).
       * @param  {Howl} self
       */
      var loadBuffer = function(self) {
        var url = self._src;

        // Check if the buffer has already been cached and use it instead.
        if (cache[url]) {
          // Set the duration from the cache.
          self._duration = cache[url].duration;

          // Load the sound into this Howl.
          loadSound(self);

          return;
        }

        if (/^data:[^;]+;base64,/.test(url)) {
          // Decode the base64 data URI without XHR, since some browsers don't support it.
          var data = atob(url.split(',')[1]);
          var dataView = new Uint8Array(data.length);
          for (var i=0; i<data.length; ++i) {
            dataView[i] = data.charCodeAt(i);
          }

          decodeAudioData(dataView.buffer, self);
        } else {
          // Load the buffer from the URL.
          var xhr = new XMLHttpRequest();
          xhr.open(self._xhr.method, url, true);
          xhr.withCredentials = self._xhr.withCredentials;
          xhr.responseType = 'arraybuffer';

          // Apply any custom headers to the request.
          if (self._xhr.headers) {
            Object.keys(self._xhr.headers).forEach(function(key) {
              xhr.setRequestHeader(key, self._xhr.headers[key]);
            });
          }

          xhr.onload = function() {
            // Make sure we get a successful response back.
            var code = (xhr.status + '')[0];
            if (code !== '0' && code !== '2' && code !== '3') {
              self._emit('loaderror', null, 'Failed loading audio file with status: ' + xhr.status + '.');
              return;
            }

            decodeAudioData(xhr.response, self);
          };
          xhr.onerror = function() {
            // If there is an error, switch to HTML5 Audio.
            if (self._webAudio) {
              self._html5 = true;
              self._webAudio = false;
              self._sounds = [];
              delete cache[url];
              self.load();
            }
          };
          safeXhrSend(xhr);
        }
      };

      /**
       * Send the XHR request wrapped in a try/catch.
       * @param  {Object} xhr XHR to send.
       */
      var safeXhrSend = function(xhr) {
        try {
          xhr.send();
        } catch (e) {
          xhr.onerror();
        }
      };

      /**
       * Decode audio data from an array buffer.
       * @param  {ArrayBuffer} arraybuffer The audio data.
       * @param  {Howl}        self
       */
      var decodeAudioData = function(arraybuffer, self) {
        // Fire a load error if something broke.
        var error = function() {
          self._emit('loaderror', null, 'Decoding audio data failed.');
        };

        // Load the sound on success.
        var success = function(buffer) {
          if (buffer && self._sounds.length > 0) {
            cache[self._src] = buffer;
            loadSound(self, buffer);
          } else {
            error();
          }
        };

        // Decode the buffer into an audio source.
        if (typeof Promise !== 'undefined' && Howler.ctx.decodeAudioData.length === 1) {
          Howler.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
        } else {
          Howler.ctx.decodeAudioData(arraybuffer, success, error);
        }
      };

      /**
       * Sound is now loaded, so finish setting everything up and fire the loaded event.
       * @param  {Howl} self
       * @param  {Object} buffer The decoded buffer sound source.
       */
      var loadSound = function(self, buffer) {
        // Set the duration.
        if (buffer && !self._duration) {
          self._duration = buffer.duration;
        }

        // Setup a sprite if none is defined.
        if (Object.keys(self._sprite).length === 0) {
          self._sprite = {__default: [0, self._duration * 1000]};
        }

        // Fire the loaded event.
        if (self._state !== 'loaded') {
          self._state = 'loaded';
          self._emit('load');
          self._loadQueue();
        }
      };

      /**
       * Setup the audio context when available, or switch to HTML5 Audio mode.
       */
      var setupAudioContext = function() {
        // If we have already detected that Web Audio isn't supported, don't run this step again.
        if (!Howler.usingWebAudio) {
          return;
        }

        // Check if we are using Web Audio and setup the AudioContext if we are.
        try {
          if (typeof AudioContext !== 'undefined') {
            Howler.ctx = new AudioContext();
          } else if (typeof webkitAudioContext !== 'undefined') {
            Howler.ctx = new webkitAudioContext();
          } else {
            Howler.usingWebAudio = false;
          }
        } catch(e) {
          Howler.usingWebAudio = false;
        }

        // If the audio context creation still failed, set using web audio to false.
        if (!Howler.ctx) {
          Howler.usingWebAudio = false;
        }

        // Check if a webview is being used on iOS8 or earlier (rather than the browser).
        // If it is, disable Web Audio as it causes crashing.
        var iOS = (/iP(hone|od|ad)/.test(Howler._navigator && Howler._navigator.platform));
        var appVersion = Howler._navigator && Howler._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
        var version = appVersion ? parseInt(appVersion[1], 10) : null;
        if (iOS && version && version < 9) {
          var safari = /safari/.test(Howler._navigator && Howler._navigator.userAgent.toLowerCase());
          if (Howler._navigator && !safari) {
            Howler.usingWebAudio = false;
          }
        }

        // Create and expose the master GainNode when using Web Audio (useful for plugins or advanced usage).
        if (Howler.usingWebAudio) {
          Howler.masterGain = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
          Howler.masterGain.gain.setValueAtTime(Howler._muted ? 0 : Howler._volume, Howler.ctx.currentTime);
          Howler.masterGain.connect(Howler.ctx.destination);
        }

        // Re-run the setup on Howler.
        Howler._setup();
      };

      // Add support for CommonJS libraries such as browserify.
      {
        exports.Howler = Howler;
        exports.Howl = Howl;
      }

      // Add to global in Node.js (for testing, etc).
      if (typeof commonjsGlobal !== 'undefined') {
        commonjsGlobal.HowlerGlobal = HowlerGlobal;
        commonjsGlobal.Howler = Howler;
        commonjsGlobal.Howl = Howl;
        commonjsGlobal.Sound = Sound;
      } else if (typeof window !== 'undefined') {  // Define globally in case AMD is not available or unused.
        window.HowlerGlobal = HowlerGlobal;
        window.Howler = Howler;
        window.Howl = Howl;
        window.Sound = Sound;
      }
    })();


    /*!
     *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
     *  
     *  howler.js v2.2.1
     *  howlerjs.com
     *
     *  (c) 2013-2020, James Simpson of GoldFire Studios
     *  goldfirestudios.com
     *
     *  MIT License
     */

    (function() {

      // Setup default properties.
      HowlerGlobal.prototype._pos = [0, 0, 0];
      HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0];

      /** Global Methods **/
      /***************************************************************************/

      /**
       * Helper method to update the stereo panning position of all current Howls.
       * Future Howls will not use this value unless explicitly set.
       * @param  {Number} pan A value of -1.0 is all the way left and 1.0 is all the way right.
       * @return {Howler/Number}     Self or current stereo panning value.
       */
      HowlerGlobal.prototype.stereo = function(pan) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self.ctx || !self.ctx.listener) {
          return self;
        }

        // Loop through all Howls and update their stereo panning.
        for (var i=self._howls.length-1; i>=0; i--) {
          self._howls[i].stereo(pan);
        }

        return self;
      };

      /**
       * Get/set the position of the listener in 3D cartesian space. Sounds using
       * 3D position will be relative to the listener's position.
       * @param  {Number} x The x-position of the listener.
       * @param  {Number} y The y-position of the listener.
       * @param  {Number} z The z-position of the listener.
       * @return {Howler/Array}   Self or current listener position.
       */
      HowlerGlobal.prototype.pos = function(x, y, z) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self.ctx || !self.ctx.listener) {
          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        y = (typeof y !== 'number') ? self._pos[1] : y;
        z = (typeof z !== 'number') ? self._pos[2] : z;

        if (typeof x === 'number') {
          self._pos = [x, y, z];

          if (typeof self.ctx.listener.positionX !== 'undefined') {
            self.ctx.listener.positionX.setTargetAtTime(self._pos[0], Howler.ctx.currentTime, 0.1);
            self.ctx.listener.positionY.setTargetAtTime(self._pos[1], Howler.ctx.currentTime, 0.1);
            self.ctx.listener.positionZ.setTargetAtTime(self._pos[2], Howler.ctx.currentTime, 0.1);
          } else {
            self.ctx.listener.setPosition(self._pos[0], self._pos[1], self._pos[2]);
          }
        } else {
          return self._pos;
        }

        return self;
      };

      /**
       * Get/set the direction the listener is pointing in the 3D cartesian space.
       * A front and up vector must be provided. The front is the direction the
       * face of the listener is pointing, and up is the direction the top of the
       * listener is pointing. Thus, these values are expected to be at right angles
       * from each other.
       * @param  {Number} x   The x-orientation of the listener.
       * @param  {Number} y   The y-orientation of the listener.
       * @param  {Number} z   The z-orientation of the listener.
       * @param  {Number} xUp The x-orientation of the top of the listener.
       * @param  {Number} yUp The y-orientation of the top of the listener.
       * @param  {Number} zUp The z-orientation of the top of the listener.
       * @return {Howler/Array}     Returns self or the current orientation vectors.
       */
      HowlerGlobal.prototype.orientation = function(x, y, z, xUp, yUp, zUp) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self.ctx || !self.ctx.listener) {
          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        var or = self._orientation;
        y = (typeof y !== 'number') ? or[1] : y;
        z = (typeof z !== 'number') ? or[2] : z;
        xUp = (typeof xUp !== 'number') ? or[3] : xUp;
        yUp = (typeof yUp !== 'number') ? or[4] : yUp;
        zUp = (typeof zUp !== 'number') ? or[5] : zUp;

        if (typeof x === 'number') {
          self._orientation = [x, y, z, xUp, yUp, zUp];

          if (typeof self.ctx.listener.forwardX !== 'undefined') {
            self.ctx.listener.forwardX.setTargetAtTime(x, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.forwardY.setTargetAtTime(y, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.forwardZ.setTargetAtTime(z, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.upX.setTargetAtTime(xUp, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.upY.setTargetAtTime(yUp, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.upZ.setTargetAtTime(zUp, Howler.ctx.currentTime, 0.1);
          } else {
            self.ctx.listener.setOrientation(x, y, z, xUp, yUp, zUp);
          }
        } else {
          return or;
        }

        return self;
      };

      /** Group Methods **/
      /***************************************************************************/

      /**
       * Add new properties to the core init.
       * @param  {Function} _super Core init method.
       * @return {Howl}
       */
      Howl.prototype.init = (function(_super) {
        return function(o) {
          var self = this;

          // Setup user-defined default properties.
          self._orientation = o.orientation || [1, 0, 0];
          self._stereo = o.stereo || null;
          self._pos = o.pos || null;
          self._pannerAttr = {
            coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : 360,
            coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : 360,
            coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : 0,
            distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : 'inverse',
            maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : 10000,
            panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : 'HRTF',
            refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : 1,
            rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : 1
          };

          // Setup event listeners.
          self._onstereo = o.onstereo ? [{fn: o.onstereo}] : [];
          self._onpos = o.onpos ? [{fn: o.onpos}] : [];
          self._onorientation = o.onorientation ? [{fn: o.onorientation}] : [];

          // Complete initilization with howler.js core's init function.
          return _super.call(this, o);
        };
      })(Howl.prototype.init);

      /**
       * Get/set the stereo panning of the audio source for this sound or all in the group.
       * @param  {Number} pan  A value of -1.0 is all the way left and 1.0 is all the way right.
       * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
       * @return {Howl/Number}    Returns self or the current stereo panning value.
       */
      Howl.prototype.stereo = function(pan, id) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // If the sound hasn't loaded, add it to the load queue to change stereo pan when capable.
        if (self._state !== 'loaded') {
          self._queue.push({
            event: 'stereo',
            action: function() {
              self.stereo(pan, id);
            }
          });

          return self;
        }

        // Check for PannerStereoNode support and fallback to PannerNode if it doesn't exist.
        var pannerType = (typeof Howler.ctx.createStereoPanner === 'undefined') ? 'spatial' : 'stereo';

        // Setup the group's stereo panning if no ID is passed.
        if (typeof id === 'undefined') {
          // Return the group's stereo panning if no parameters are passed.
          if (typeof pan === 'number') {
            self._stereo = pan;
            self._pos = [pan, 0, 0];
          } else {
            return self._stereo;
          }
        }

        // Change the streo panning of one or all sounds in group.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          // Get the sound.
          var sound = self._soundById(ids[i]);

          if (sound) {
            if (typeof pan === 'number') {
              sound._stereo = pan;
              sound._pos = [pan, 0, 0];

              if (sound._node) {
                // If we are falling back, make sure the panningModel is equalpower.
                sound._pannerAttr.panningModel = 'equalpower';

                // Check if there is a panner setup and create a new one if not.
                if (!sound._panner || !sound._panner.pan) {
                  setupPanner(sound, pannerType);
                }

                if (pannerType === 'spatial') {
                  if (typeof sound._panner.positionX !== 'undefined') {
                    sound._panner.positionX.setValueAtTime(pan, Howler.ctx.currentTime);
                    sound._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime);
                    sound._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime);
                  } else {
                    sound._panner.setPosition(pan, 0, 0);
                  }
                } else {
                  sound._panner.pan.setValueAtTime(pan, Howler.ctx.currentTime);
                }
              }

              self._emit('stereo', sound._id);
            } else {
              return sound._stereo;
            }
          }
        }

        return self;
      };

      /**
       * Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.
       * @param  {Number} x  The x-position of the audio source.
       * @param  {Number} y  The y-position of the audio source.
       * @param  {Number} z  The z-position of the audio source.
       * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
       * @return {Howl/Array}    Returns self or the current 3D spatial position: [x, y, z].
       */
      Howl.prototype.pos = function(x, y, z, id) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // If the sound hasn't loaded, add it to the load queue to change position when capable.
        if (self._state !== 'loaded') {
          self._queue.push({
            event: 'pos',
            action: function() {
              self.pos(x, y, z, id);
            }
          });

          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        y = (typeof y !== 'number') ? 0 : y;
        z = (typeof z !== 'number') ? -0.5 : z;

        // Setup the group's spatial position if no ID is passed.
        if (typeof id === 'undefined') {
          // Return the group's spatial position if no parameters are passed.
          if (typeof x === 'number') {
            self._pos = [x, y, z];
          } else {
            return self._pos;
          }
        }

        // Change the spatial position of one or all sounds in group.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          // Get the sound.
          var sound = self._soundById(ids[i]);

          if (sound) {
            if (typeof x === 'number') {
              sound._pos = [x, y, z];

              if (sound._node) {
                // Check if there is a panner setup and create a new one if not.
                if (!sound._panner || sound._panner.pan) {
                  setupPanner(sound, 'spatial');
                }

                if (typeof sound._panner.positionX !== 'undefined') {
                  sound._panner.positionX.setValueAtTime(x, Howler.ctx.currentTime);
                  sound._panner.positionY.setValueAtTime(y, Howler.ctx.currentTime);
                  sound._panner.positionZ.setValueAtTime(z, Howler.ctx.currentTime);
                } else {
                  sound._panner.setPosition(x, y, z);
                }
              }

              self._emit('pos', sound._id);
            } else {
              return sound._pos;
            }
          }
        }

        return self;
      };

      /**
       * Get/set the direction the audio source is pointing in the 3D cartesian coordinate
       * space. Depending on how direction the sound is, based on the `cone` attributes,
       * a sound pointing away from the listener can be quiet or silent.
       * @param  {Number} x  The x-orientation of the source.
       * @param  {Number} y  The y-orientation of the source.
       * @param  {Number} z  The z-orientation of the source.
       * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
       * @return {Howl/Array}    Returns self or the current 3D spatial orientation: [x, y, z].
       */
      Howl.prototype.orientation = function(x, y, z, id) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // If the sound hasn't loaded, add it to the load queue to change orientation when capable.
        if (self._state !== 'loaded') {
          self._queue.push({
            event: 'orientation',
            action: function() {
              self.orientation(x, y, z, id);
            }
          });

          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        y = (typeof y !== 'number') ? self._orientation[1] : y;
        z = (typeof z !== 'number') ? self._orientation[2] : z;

        // Setup the group's spatial orientation if no ID is passed.
        if (typeof id === 'undefined') {
          // Return the group's spatial orientation if no parameters are passed.
          if (typeof x === 'number') {
            self._orientation = [x, y, z];
          } else {
            return self._orientation;
          }
        }

        // Change the spatial orientation of one or all sounds in group.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          // Get the sound.
          var sound = self._soundById(ids[i]);

          if (sound) {
            if (typeof x === 'number') {
              sound._orientation = [x, y, z];

              if (sound._node) {
                // Check if there is a panner setup and create a new one if not.
                if (!sound._panner) {
                  // Make sure we have a position to setup the node with.
                  if (!sound._pos) {
                    sound._pos = self._pos || [0, 0, -0.5];
                  }

                  setupPanner(sound, 'spatial');
                }

                if (typeof sound._panner.orientationX !== 'undefined') {
                  sound._panner.orientationX.setValueAtTime(x, Howler.ctx.currentTime);
                  sound._panner.orientationY.setValueAtTime(y, Howler.ctx.currentTime);
                  sound._panner.orientationZ.setValueAtTime(z, Howler.ctx.currentTime);
                } else {
                  sound._panner.setOrientation(x, y, z);
                }
              }

              self._emit('orientation', sound._id);
            } else {
              return sound._orientation;
            }
          }
        }

        return self;
      };

      /**
       * Get/set the panner node's attributes for a sound or group of sounds.
       * This method can optionall take 0, 1 or 2 arguments.
       *   pannerAttr() -> Returns the group's values.
       *   pannerAttr(id) -> Returns the sound id's values.
       *   pannerAttr(o) -> Set's the values of all sounds in this Howl group.
       *   pannerAttr(o, id) -> Set's the values of passed sound id.
       *
       *   Attributes:
       *     coneInnerAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
       *                      inside of which there will be no volume reduction.
       *     coneOuterAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
       *                      outside of which the volume will be reduced to a constant value of `coneOuterGain`.
       *     coneOuterGain - (0 by default) A parameter for directional audio sources, this is the gain outside of the
       *                     `coneOuterAngle`. It is a linear value in the range `[0, 1]`.
       *     distanceModel - ('inverse' by default) Determines algorithm used to reduce volume as audio moves away from
       *                     listener. Can be `linear`, `inverse` or `exponential.
       *     maxDistance - (10000 by default) The maximum distance between source and listener, after which the volume
       *                   will not be reduced any further.
       *     refDistance - (1 by default) A reference distance for reducing volume as source moves further from the listener.
       *                   This is simply a variable of the distance model and has a different effect depending on which model
       *                   is used and the scale of your coordinates. Generally, volume will be equal to 1 at this distance.
       *     rolloffFactor - (1 by default) How quickly the volume reduces as source moves from listener. This is simply a
       *                     variable of the distance model and can be in the range of `[0, 1]` with `linear` and `[0, ∞]`
       *                     with `inverse` and `exponential`.
       *     panningModel - ('HRTF' by default) Determines which spatialization algorithm is used to position audio.
       *                     Can be `HRTF` or `equalpower`.
       *
       * @return {Howl/Object} Returns self or current panner attributes.
       */
      Howl.prototype.pannerAttr = function() {
        var self = this;
        var args = arguments;
        var o, id, sound;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // Determine the values based on arguments.
        if (args.length === 0) {
          // Return the group's panner attribute values.
          return self._pannerAttr;
        } else if (args.length === 1) {
          if (typeof args[0] === 'object') {
            o = args[0];

            // Set the grou's panner attribute values.
            if (typeof id === 'undefined') {
              if (!o.pannerAttr) {
                o.pannerAttr = {
                  coneInnerAngle: o.coneInnerAngle,
                  coneOuterAngle: o.coneOuterAngle,
                  coneOuterGain: o.coneOuterGain,
                  distanceModel: o.distanceModel,
                  maxDistance: o.maxDistance,
                  refDistance: o.refDistance,
                  rolloffFactor: o.rolloffFactor,
                  panningModel: o.panningModel
                };
              }

              self._pannerAttr = {
                coneInnerAngle: typeof o.pannerAttr.coneInnerAngle !== 'undefined' ? o.pannerAttr.coneInnerAngle : self._coneInnerAngle,
                coneOuterAngle: typeof o.pannerAttr.coneOuterAngle !== 'undefined' ? o.pannerAttr.coneOuterAngle : self._coneOuterAngle,
                coneOuterGain: typeof o.pannerAttr.coneOuterGain !== 'undefined' ? o.pannerAttr.coneOuterGain : self._coneOuterGain,
                distanceModel: typeof o.pannerAttr.distanceModel !== 'undefined' ? o.pannerAttr.distanceModel : self._distanceModel,
                maxDistance: typeof o.pannerAttr.maxDistance !== 'undefined' ? o.pannerAttr.maxDistance : self._maxDistance,
                refDistance: typeof o.pannerAttr.refDistance !== 'undefined' ? o.pannerAttr.refDistance : self._refDistance,
                rolloffFactor: typeof o.pannerAttr.rolloffFactor !== 'undefined' ? o.pannerAttr.rolloffFactor : self._rolloffFactor,
                panningModel: typeof o.pannerAttr.panningModel !== 'undefined' ? o.pannerAttr.panningModel : self._panningModel
              };
            }
          } else {
            // Return this sound's panner attribute values.
            sound = self._soundById(parseInt(args[0], 10));
            return sound ? sound._pannerAttr : self._pannerAttr;
          }
        } else if (args.length === 2) {
          o = args[0];
          id = parseInt(args[1], 10);
        }

        // Update the values of the specified sounds.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          sound = self._soundById(ids[i]);

          if (sound) {
            // Merge the new values into the sound.
            var pa = sound._pannerAttr;
            pa = {
              coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : pa.coneInnerAngle,
              coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : pa.coneOuterAngle,
              coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : pa.coneOuterGain,
              distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : pa.distanceModel,
              maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : pa.maxDistance,
              refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : pa.refDistance,
              rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : pa.rolloffFactor,
              panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : pa.panningModel
            };

            // Update the panner values or create a new panner if none exists.
            var panner = sound._panner;
            if (panner) {
              panner.coneInnerAngle = pa.coneInnerAngle;
              panner.coneOuterAngle = pa.coneOuterAngle;
              panner.coneOuterGain = pa.coneOuterGain;
              panner.distanceModel = pa.distanceModel;
              panner.maxDistance = pa.maxDistance;
              panner.refDistance = pa.refDistance;
              panner.rolloffFactor = pa.rolloffFactor;
              panner.panningModel = pa.panningModel;
            } else {
              // Make sure we have a position to setup the node with.
              if (!sound._pos) {
                sound._pos = self._pos || [0, 0, -0.5];
              }

              // Create a new panner node.
              setupPanner(sound, 'spatial');
            }
          }
        }

        return self;
      };

      /** Single Sound Methods **/
      /***************************************************************************/

      /**
       * Add new properties to the core Sound init.
       * @param  {Function} _super Core Sound init method.
       * @return {Sound}
       */
      Sound.prototype.init = (function(_super) {
        return function() {
          var self = this;
          var parent = self._parent;

          // Setup user-defined default properties.
          self._orientation = parent._orientation;
          self._stereo = parent._stereo;
          self._pos = parent._pos;
          self._pannerAttr = parent._pannerAttr;

          // Complete initilization with howler.js core Sound's init function.
          _super.call(this);

          // If a stereo or position was specified, set it up.
          if (self._stereo) {
            parent.stereo(self._stereo);
          } else if (self._pos) {
            parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
          }
        };
      })(Sound.prototype.init);

      /**
       * Override the Sound.reset method to clean up properties from the spatial plugin.
       * @param  {Function} _super Sound reset method.
       * @return {Sound}
       */
      Sound.prototype.reset = (function(_super) {
        return function() {
          var self = this;
          var parent = self._parent;

          // Reset all spatial plugin properties on this sound.
          self._orientation = parent._orientation;
          self._stereo = parent._stereo;
          self._pos = parent._pos;
          self._pannerAttr = parent._pannerAttr;

          // If a stereo or position was specified, set it up.
          if (self._stereo) {
            parent.stereo(self._stereo);
          } else if (self._pos) {
            parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
          } else if (self._panner) {
            // Disconnect the panner.
            self._panner.disconnect(0);
            self._panner = undefined;
            parent._refreshBuffer(self);
          }

          // Complete resetting of the sound.
          return _super.call(this);
        };
      })(Sound.prototype.reset);

      /** Helper Methods **/
      /***************************************************************************/

      /**
       * Create a new panner node and save it on the sound.
       * @param  {Sound} sound Specific sound to setup panning on.
       * @param {String} type Type of panner to create: 'stereo' or 'spatial'.
       */
      var setupPanner = function(sound, type) {
        type = type || 'spatial';

        // Create the new panner node.
        if (type === 'spatial') {
          sound._panner = Howler.ctx.createPanner();
          sound._panner.coneInnerAngle = sound._pannerAttr.coneInnerAngle;
          sound._panner.coneOuterAngle = sound._pannerAttr.coneOuterAngle;
          sound._panner.coneOuterGain = sound._pannerAttr.coneOuterGain;
          sound._panner.distanceModel = sound._pannerAttr.distanceModel;
          sound._panner.maxDistance = sound._pannerAttr.maxDistance;
          sound._panner.refDistance = sound._pannerAttr.refDistance;
          sound._panner.rolloffFactor = sound._pannerAttr.rolloffFactor;
          sound._panner.panningModel = sound._pannerAttr.panningModel;

          if (typeof sound._panner.positionX !== 'undefined') {
            sound._panner.positionX.setValueAtTime(sound._pos[0], Howler.ctx.currentTime);
            sound._panner.positionY.setValueAtTime(sound._pos[1], Howler.ctx.currentTime);
            sound._panner.positionZ.setValueAtTime(sound._pos[2], Howler.ctx.currentTime);
          } else {
            sound._panner.setPosition(sound._pos[0], sound._pos[1], sound._pos[2]);
          }

          if (typeof sound._panner.orientationX !== 'undefined') {
            sound._panner.orientationX.setValueAtTime(sound._orientation[0], Howler.ctx.currentTime);
            sound._panner.orientationY.setValueAtTime(sound._orientation[1], Howler.ctx.currentTime);
            sound._panner.orientationZ.setValueAtTime(sound._orientation[2], Howler.ctx.currentTime);
          } else {
            sound._panner.setOrientation(sound._orientation[0], sound._orientation[1], sound._orientation[2]);
          }
        } else {
          sound._panner = Howler.ctx.createStereoPanner();
          sound._panner.pan.setValueAtTime(sound._stereo, Howler.ctx.currentTime);
        }

        sound._panner.connect(sound._node);

        // Update the connections.
        if (!sound._paused) {
          sound._parent.pause(sound._id, true).play(sound._id, true);
        }
      };
    })();
    });
    var howler_1 = howler.Howler;
    var howler_2 = howler.Howl;

    /* assets/src/components/Play.svelte generated by Svelte v3.6.1 */

    const file$1 = "assets/src/components/Play.svelte";

    // (20:6) {:else}
    function create_else_block(ctx) {
    	var span, t;

    	return {
    		c: function create() {
    			span = element("span");
    			t = text(ctx.icon_play);
    			attr(span, "class", "material-icons md-36 fill-current relative z-10 text-blue-600 bg-white rounded-full \n      shadow-lg  hover:text-opacity-70 svelte-1hstyms");
    			add_location(span, file$1, 20, 6, 624);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.icon_play) {
    				set_data(t, ctx.icon_play);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}
    		}
    	};
    }

    // (12:2) {#if toggle == true }
    function create_if_block(ctx) {
    	var span0, t0, t1, span1;

    	return {
    		c: function create() {
    			span0 = element("span");
    			t0 = text(ctx.icon_pause);
    			t1 = space();
    			span1 = element("span");
    			attr(span0, "class", "material-icons md-36 fill-current relative z-10 text-blue-600 bg-white rounded-full \n  shadow-lg  hover:text-opacity-70 svelte-1hstyms");
    			add_location(span0, file$1, 12, 2, 317);
    			attr(span1, "class", "animate-ping absolute top-2 left-2 z-1 rounded-full w-11 h-11 bg-white opacity-40");
    			add_location(span1, file$1, 16, 4, 487);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span0, anchor);
    			append(span0, t0);
    			insert(target, t1, anchor);
    			insert(target, span1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.icon_pause) {
    				set_data(t0, ctx.icon_pause);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span0);
    				detach(t1);
    				detach(span1);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var button, dispose;

    	function select_block_type(ctx) {
    		if (ctx.toggle == true) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr(button, "id", "player");
    			attr(button, "class", "transition transform duration-500 ease-in hover:scale-105");
    			add_location(button, file$1, 10, 0, 159);

    			dispose = [
    				listen(button, "click", ctx.click_handler),
    				listen(button, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			if_block.m(button, null);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { icon_play = "play_circle_outline", icon_pause = "pause_circle_outline", toggle = false } = $$props;

    	const writable_props = ['icon_play', 'icon_pause', 'toggle'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Play> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1() {toggle = !toggle; $$invalidate('toggle', toggle);}

    	$$self.$set = $$props => {
    		if ('icon_play' in $$props) $$invalidate('icon_play', icon_play = $$props.icon_play);
    		if ('icon_pause' in $$props) $$invalidate('icon_pause', icon_pause = $$props.icon_pause);
    		if ('toggle' in $$props) $$invalidate('toggle', toggle = $$props.toggle);
    	};

    	return {
    		icon_play,
    		icon_pause,
    		toggle,
    		click_handler,
    		click_handler_1
    	};
    }

    class Play extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["icon_play", "icon_pause", "toggle"]);
    	}

    	get icon_play() {
    		throw new Error("<Play>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon_play(value) {
    		throw new Error("<Play>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon_pause() {
    		throw new Error("<Play>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon_pause(value) {
    		throw new Error("<Play>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Play>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Play>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* assets/src/components/Volume.svelte generated by Svelte v3.6.1 */

    const file$2 = "assets/src/components/Volume.svelte";

    // (13:4) {#if volume >= 30 }
    function create_if_block_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("volume_mute");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (16:4) {#if volume >= 50 }
    function create_if_block_1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("volume_down");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (19:4) {#if volume > 50 }
    function create_if_block$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("volume_up");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var button, t0, t1, t2, t3, t4, div, input, dispose;

    	var if_block0 = (ctx.volume >= 30) && create_if_block_2();

    	var if_block1 = (ctx.volume >= 50) && create_if_block_1();

    	var if_block2 = (ctx.volume > 50) && create_if_block$1();

    	return {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			t3 = text(ctx.volume);
    			t4 = space();
    			div = element("div");
    			input = element("input");
    			attr(button, "class", "material-icons  text-white");
    			add_location(button, file$2, 8, 0, 55);
    			attr(input, "type", "range");
    			attr(input, "class", "rounded-full absolute  z-50 opacity-90 overflow-hidden \n    appearance-none transform rotate-90 bottom-14 left-2  cursor-pointer bg-gray-400 h-4 w-24");
    			attr(input, "min", "1");
    			attr(input, "max", "100");
    			attr(input, "step", "1");
    			add_location(input, file$2, 26, 4, 321);
    			attr(div, "class", "relative right-20");
    			add_location(div, file$2, 24, 2, 284);

    			dispose = [
    				listen(input, "change", ctx.input_change_input_handler),
    				listen(input, "input", ctx.input_change_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append(button, t0);
    			if (if_block1) if_block1.m(button, null);
    			append(button, t1);
    			if (if_block2) if_block2.m(button, null);
    			insert(target, t2, anchor);
    			insert(target, t3, anchor);
    			insert(target, t4, anchor);
    			insert(target, div, anchor);
    			append(div, input);

    			input.value = ctx.volume;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.volume >= 30) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2();
    					if_block0.c();
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.volume >= 50) {
    				if (!if_block1) {
    					if_block1 = create_if_block_1();
    					if_block1.c();
    					if_block1.m(button, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (ctx.volume > 50) {
    				if (!if_block2) {
    					if_block2 = create_if_block$1();
    					if_block2.c();
    					if_block2.m(button, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (changed.volume) {
    				set_data(t3, ctx.volume);
    			}

    			if (changed.volume) input.value = ctx.volume;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();

    			if (detaching) {
    				detach(t2);
    				detach(t3);
    				detach(t4);
    				detach(div);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { volume = '0.5' } = $$props;

    	const writable_props = ['volume'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Volume> was created with unknown prop '${key}'`);
    	});

    	function input_change_input_handler() {
    		volume = to_number(this.value);
    		$$invalidate('volume', volume);
    	}

    	$$self.$set = $$props => {
    		if ('volume' in $$props) $$invalidate('volume', volume = $$props.volume);
    	};

    	return { volume, input_change_input_handler };
    }

    class Volume extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["volume"]);
    	}

    	get volume() {
    		throw new Error("<Volume>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set volume(value) {
    		throw new Error("<Volume>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* assets/src/components/Nav.svelte generated by Svelte v3.6.1 */

    const file$3 = "assets/src/components/Nav.svelte";

    // (67:8) <Volume volume={40} >
    function create_default_slot(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		d: noop
    	};
    }

    function create_fragment$3(ctx) {
    	var nav, div4, div0, img, t0, div1, b, t2, br, t3, div3, t4, span0, t6, t7, span1, t8, t9_value = ctx.sound.state(), t9, t10, div2, button0, t12, button1, current;

    	var play = new Play({
    		props: { toggle: ctx.sound._autoplay },
    		$$inline: true
    	});
    	play.$on("click", ctx.station_player);
    	play.$on("click", ctx.click_handler);

    	var volume = new Volume({
    		props: {
    		volume: 40,
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			nav = element("nav");
    			div4 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			b = element("b");
    			b.textContent = "PLAY NOW:";
    			t2 = text(" Music Forrever ");
    			br = element("br");
    			t3 = space();
    			div3 = element("div");
    			play.$$.fragment.c();
    			t4 = space();
    			span0 = element("span");
    			span0.textContent = "Live";
    			t6 = space();
    			volume.$$.fragment.c();
    			t7 = space();
    			span1 = element("span");
    			t8 = text("Time: ");
    			t9 = text(t9_value);
    			t10 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "favorite_border";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "share";
    			attr(img, "class", "w-24 block h-24 duration-75 delay-500  rounded-xl absolute bottom-0");
    			attr(img, "src", "https://placeimg.com/640/480/natural");
    			attr(img, "alt", "");
    			add_location(img, file$3, 45, 10, 1041);
    			attr(div0, "class", "p-1 mr-20");
    			add_location(div0, file$3, 44, 8, 1007);
    			attr(b, "class", "");
    			add_location(b, file$3, 52, 80, 1319);
    			add_location(br, file$3, 52, 122, 1361);
    			attr(div1, "class", "text-white antialiased text-xs md:text-base md:antialiased");
    			add_location(div1, file$3, 52, 8, 1247);
    			attr(span0, "class", "text-xs font-semibold antialiased text-xs text-white shadow-md bg-red-600 p-1 rounded-md uppercase");
    			add_location(span0, file$3, 60, 10, 1629);
    			attr(span1, "class", "leading-8 hidden md:block text-white");
    			add_location(span1, file$3, 71, 10, 1901);
    			attr(button0, "class", "material-icons text-white");
    			add_location(button0, file$3, 73, 12, 2030);
    			attr(button1, "class", "material-icons text-white");
    			add_location(button1, file$3, 74, 12, 2109);
    			attr(div2, "class", "icons-button");
    			add_location(div2, file$3, 72, 10, 1991);
    			attr(div3, "class", "flex justify-center items-center px-1 md:px-24 space-x-3");
    			add_location(div3, file$3, 54, 8, 1391);
    			attr(div4, "class", "relative flex space-x-9 items-center   w-full w-screen  max-w-screen-lg container mx-auto ");
    			add_location(div4, file$3, 42, 8, 885);
    			attr(nav, "id", "app");
    			attr(nav, "class", "bg-blue-500 mt-16 flex items-center bg-opacity-100 h-24");
    			add_location(nav, file$3, 40, 4, 789);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, div4);
    			append(div4, div0);
    			append(div0, img);
    			append(div4, t0);
    			append(div4, div1);
    			append(div1, b);
    			append(div1, t2);
    			append(div1, br);
    			append(div4, t3);
    			append(div4, div3);
    			mount_component(play, div3, null);
    			append(div3, t4);
    			append(div3, span0);
    			append(div3, t6);
    			mount_component(volume, div3, null);
    			append(div3, t7);
    			append(div3, span1);
    			append(span1, t8);
    			append(span1, t9);
    			append(div3, t10);
    			append(div3, div2);
    			append(div2, button0);
    			append(div2, t12);
    			append(div2, button1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var play_changes = {};
    			if (changed.sound) play_changes.toggle = ctx.sound._autoplay;
    			play.$set(play_changes);

    			var volume_changes = {};
    			if (changed.$$scope) volume_changes.$$scope = { changed, ctx };
    			volume.$set(volume_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(play.$$.fragment, local);

    			transition_in(volume.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(play.$$.fragment, local);
    			transition_out(volume.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(nav);
    			}

    			destroy_component(play, );

    			destroy_component(volume, );
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	
       const stationData = document.body.dataset.station;
       const station = JSON.parse(stationData);
       
       let sound = new howler_2({
         src: station.icecast != "" ? station.icecast : station.shoutcast,
         autoplay: false,
         html5: true, 
         format: ['mp3', 'aac']
        });
     
      let active = false;
      
      const station_player = () => {
      
      if(active == true){
         sound.stop();
          
      }else {
         sound.play();
       }
        
      };

    	function click_handler() {active = !active; $$invalidate('active', active);}

    	return {
    		sound,
    		active,
    		station_player,
    		click_handler
    	};
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* assets/src/App.svelte generated by Svelte v3.6.1 */

    // (14:0) <Container>
    function create_default_slot$1(ctx) {
    	var current;

    	var nav = new Nav({ $$inline: true });

    	return {
    		c: function create() {
    			nav.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(nav, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, []);
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
