/*
# nth-Everthing made with js. #

##Implemented nth- ##
:nth-letter
:nth-word


## Implemented last-##
:last-word
:last-letter

## Implemented first- ##
:first-word (faster than :nth-word(1))


## Things that work ##

Add a hover effet to each odd letter
  .className:nth-letter(odd):hover{}


Add a hover effect to :before/:after
  .className:nth-letter(odd):hover:after{}



## Things that don't and will not work ##
.className:before:nth-letter



Read more: http://css-tricks.com/a-call-for-nth-everything/
*/

(function($) {

  /*jshint  loopfunc:true, onevar:true*/
  /*global  jQuery:true, browser:true */

  $.fn.nthEverything = function() {
    var styleSuffix   = "-nthEvery",

    cssPattern        = /\s*(.*?)\s*\{(.*?)\}/g,
    cssComments       = /\s*(?!<\")\/\*[^\*]+\*\/(?!\")\s*/gm,
    partsPattern      = /([^:]+)/g,
    nthPattern        = /(\w*)-(\w*)(\((even|odd|[\+-n\d]{1,6})\))?/,
    wordSpacePattern  = /(\s*[^ ]+\s*)/g,
    wordSimplePattern = /\s+/,
    count,
    // To store the style per Selector
    parsedStyleMap = {},
    // CSS for the classes
    genCSS = '',


    runPeriods  = function(period, className, a, length, offset){
            var inBy       = 0,
                sAt        = +period,
                matches,
                n, zB, zE, bF, eF, oldN = -1;

            if (period === 'odd' || period === 'even'){
                  sAt = (period === 'odd') ? 1 : 2;
                  inBy = 2;
            }else if (/^\d+$/.test(period)){
                sAt = period - offset;
                inBy = 0;
            }else{
                zB   = /^(\+|-)?\d+/.exec(period);
                zE   = /(\+|-)?\d+$/.exec(period);

                sAt  = (zE)?+(zE[0]):1;
                inBy = (zB)?+(zB[0]):1;

                bF = (zB)?zB.length-1:0;
                eF = (zE)?zE.length:0;
                if ((period.substr(bF, period.length-eF-bF).charAt(0)) === '-'){
                   inBy*=-1;
                }
            }

        // Start index at 0;
        sAt--;

        for (n=sAt;n<length;n+=inBy){
            if (n < 0 || n === oldN) break;
            if (a[n] === undefined){
                 a[n] = className;
            }else{
                 a[n] += " "+className;
            }
            oldN = n;
        }
    },

    createSpan = function(className, content){
          return '<span class="'+className+'">'+content+'</span>';
    },


    processPeriod = function(classNames, textArray){
        var newText = '', n, className;
        for (n=0;n<classNames.length;n++){
            className = classNames[n];
            if (className === undefined){
                newText += textArray[n];
            }else{
                newText += createSpan(className, textArray[n]);
            }
        }
           return newText;
    },

    getClassNames  = function(parsedStyle, length, pFunc){
                   var classNames = new Array(length), i;
                   for (i=0;i<parsedStyle.period.length;i++){
                       runPeriods (pFunc(parsedStyle.period[i], length), parsedStyle.className[i], classNames, length);
                   }
                   return classNames;
    },

    prepareTxt = {
             word  : function(text){return text.match(wordSpacePattern);},
            letter: function(text){return text.split('');}
    },

    pseudoFunc = {
        first : {
            word :  function(period){
                     if (period === 'firstword') period = '1';
                     return period;
            }
        },
        last : {
            word : function(period, allText, length){
                    if (period === 'lastword') period = ''+allText.match(wordSpacePattern).length;
                    return period;
            }
        },
        nth : {
            letter : function (period){
                    return period;
            },
            word :  function(period){
                    return period;
            }
        }
    },

    loopRecursive = function (contents, allText, parsedStyle){
         var func = parsedStyle.func, text, length, classNames, className, cat, period;
         contents.each(function(){
            if (this.nodeType === 1){
                loopRecursive($(this).contents(), allText, parsedStyle);
            }else if(this.nodeType === 3){
                 text = prepareTxt[func](this.nodeValue);
                 length = text.length;
                 classNames = new Array(length);
                 for (var i=0;i<parsedStyle.period.length;i++){
                     className = parsedStyle.className[i];
                     cat       = parsedStyle.cat[i];
                     period    = parsedStyle.period[i];
                     runPeriods (pseudoFunc[cat][func](period, allText, length), className, classNames, length, count);
                 }

                $(this).replaceWith( processPeriod(classNames, text) );

                count += length;
            }
        });
        return count;
    },

    parse = function(css) {
       var matches, nthMatch, nthFound = false, i, thisPeriod, selectors, style, selector, parts, nth, pseudo, cat, func, period, normSelector, ident, className;


       css = css.replace(cssComments, '').replace(/\n|\r/g, '');

       while ((matches = cssPattern.exec(css)) !== null){
          selectors = matches[1].split(',');
          style     = matches[2];
          for (i=0;i<selectors.length;i++){
              selector  = selectors[i];
              parts     = selector.match(partsPattern);

              selector = parts.shift();
              nth      = parts.shift();
              pseudo   = (parts.length !== 0)?':'+parts.join(':'):'';

              if ((nthMatch = nthPattern.exec(nth)) !== null){
                   nthFound  = true;

                   cat    = nthMatch[1];
                   func   = nthMatch[2];
                   period = (nthMatch[4]!==undefined)?nthMatch[4]:cat+func;

                   normSelector = selector.replace('#','id').replace('.', 'class');
                   ident        = normSelector + func;
                   className    = normSelector + cat + func + period + styleSuffix;

                  if ((thisPeriod = parsedStyleMap[ident]) !== undefined){
                      thisPeriod.className.push(className);
                      thisPeriod.period.push(period);
                      thisPeriod.style.push(style);
                      thisPeriod.pseudo.push(pseudo);
                      thisPeriod.cat.push(cat);
                  }else{
                      parsedStyleMap[ident] = {element : selector, func : func, className : [className],  cat : [cat], period : [period], style :[style], pseudo : [pseudo]};
                  }
              }else if (nthFound === true){
                 genCSS += selector+"{"+style+"}"; // Fix chained selectors.
              }
          }
       }
    },

    applyStyles = function(){
        var id, parsedStyle, func, b;
        for (id in parsedStyleMap){
               parsedStyle = parsedStyleMap[id];
               func = parsedStyle.func;

               $(parsedStyle.element).each(function(){
                   var $this     = $(this);
                   count = 0; // Set to 0. We use a recursive Loop here
                   loopRecursive($this.contents(), $this.text(), parsedStyle);
               });

               for (b=0;b<parsedStyle.className.length;b++){
                   genCSS += "."+parsedStyle.className[b]+parsedStyle.pseudo[b]+"{"+parsedStyle.style[b]+"}";
               }
         }

         $('<style>' + genCSS + '</style>').appendTo('head');
    };

    // Build CSS Rules
    $('link[rel=stylesheet],style').each(function() {
        if ($(this).is('link')) $.get(this.href).success(function(css) { parse(css); }); else parse($(this).text());
    });

    // Apply Styles.
    applyStyles();

  };
})(jQuery);

$.fn.nthEverything();