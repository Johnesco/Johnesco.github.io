(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(r){if(r.ep)return;r.ep=!0;const a=t(r);fetch(r.href,a)}})();var i=(s=>(s.SET="SET",s.TO="TO",s.IF="IF",s.THEN="THEN",s.ELSE="ELSE",s.END="END",s.FUNCTION="FUNCTION",s.TAKING="TAKING",s.WITH="WITH",s.REPEAT="REPEAT",s.TIMES="TIMES",s.WHILE="WHILE",s.FOR="FOR",s.EACH="EACH",s.IN="IN",s.DO="DO",s.RETURN="RETURN",s.AND="AND",s.OR="OR",s.NOT="NOT",s.IS="IS",s.EQUAL="EQUAL",s.GREATER="GREATER",s.LESS="LESS",s.THAN="THAN",s.PLUS="PLUS",s.MINUS="MINUS",s.TIMES_OP="TIMES_OP",s.DIVIDED="DIVIDED",s.BY="BY",s.MOD="MOD",s.JOINED="JOINED",s.LIST="LIST",s.OF="OF",s.ITEM="ITEM",s.YES="YES",s.NO="NO",s.PRINT="PRINT",s.DRAW="DRAW",s.CIRCLE="CIRCLE",s.RECTANGLE="RECTANGLE",s.LINE="LINE",s.AT="AT",s.FROM="FROM",s.RADIUS="RADIUS",s.WIDTH="WIDTH",s.HEIGHT="HEIGHT",s.COLOR="COLOR",s.CLEAR="CLEAR",s.CANVAS="CANVAS",s.NUMBER="NUMBER",s.STRING="STRING",s.IDENTIFIER="IDENTIFIER",s.LENGTH="LENGTH",s.ASK="ASK",s.STORE="STORE",s.RANDOM="RANDOM",s.NUMBER_KW="NUMBER_KW",s.COMMA="COMMA",s.PLUS_SYMBOL="PLUS_SYMBOL",s.MINUS_SYMBOL="MINUS_SYMBOL",s.STAR="STAR",s.SLASH="SLASH",s.LEFT_PAREN="LEFT_PAREN",s.RIGHT_PAREN="RIGHT_PAREN",s.NEWLINE="NEWLINE",s.EOF="EOF",s))(i||{});class E extends Error{constructor(e,t,n,r){super(e),this.name="ClearError",this.line=t,this.column=n,this.hint=r}format(e){let t=`Error on line ${this.line}: ${this.message}`;if(e){const r=e.split(`
`)[this.line-1];r&&(t+=`

`,t+=`  ${this.line} | ${r}
`,t+=`  ${" ".repeat(String(this.line).length)} | ${" ".repeat(this.column-1)}^`)}return this.hint&&(t+=`

Hint: ${this.hint}`),t}}class p extends E{constructor(e,t,n,r){super(e,t,n,r),this.name="ParseError"}}class h extends E{constructor(e,t,n=1,r){super(e,t,n,r),this.name="RuntimeError"}}function A(s,e){const t=s.toLowerCase(),n=e.filter(o=>o.startsWith(t));if(n.length===1)return n[0];let r=null,a=1/0;for(const o of e){const c=R(t,o.toLowerCase());c<a&&c<=2&&(a=c,r=o)}return r}function R(s,e){const t=[];for(let n=0;n<=e.length;n++)t[n]=[n];for(let n=0;n<=s.length;n++)t[0][n]=n;for(let n=1;n<=e.length;n++)for(let r=1;r<=s.length;r++)e[n-1]===s[r-1]?t[n][r]=t[n-1][r-1]:t[n][r]=Math.min(t[n-1][r-1]+1,t[n][r-1]+1,t[n-1][r]+1);return t[e.length][s.length]}const L={set:i.SET,to:i.TO,if:i.IF,then:i.THEN,else:i.ELSE,end:i.END,function:i.FUNCTION,taking:i.TAKING,with:i.WITH,repeat:i.REPEAT,times:i.TIMES,while:i.WHILE,for:i.FOR,each:i.EACH,in:i.IN,do:i.DO,return:i.RETURN,and:i.AND,or:i.OR,not:i.NOT,is:i.IS,equal:i.EQUAL,greater:i.GREATER,less:i.LESS,than:i.THAN,plus:i.PLUS,minus:i.MINUS,divided:i.DIVIDED,by:i.BY,mod:i.MOD,joined:i.JOINED,list:i.LIST,of:i.OF,item:i.ITEM,yes:i.YES,no:i.NO,print:i.PRINT,draw:i.DRAW,circle:i.CIRCLE,rectangle:i.RECTANGLE,line:i.LINE,at:i.AT,from:i.FROM,radius:i.RADIUS,width:i.WIDTH,height:i.HEIGHT,color:i.COLOR,clear:i.CLEAR,canvas:i.CANVAS,length:i.LENGTH,ask:i.ASK,store:i.STORE,random:i.RANDOM,number:i.NUMBER_KW};class C{constructor(e){this.tokens=[],this.start=0,this.current=0,this.line=1,this.column=1,this.lineStart=0,this.source=e}tokenize(){for(;!this.isAtEnd();)this.start=this.current,this.scanToken();return this.tokens.push({type:i.EOF,value:"",line:this.line,column:this.column}),this.tokens}scanToken(){const e=this.advance();switch(e){case" ":case"\r":case"	":break;case`
`:this.addToken(i.NEWLINE,"\\n"),this.line++,this.lineStart=this.current,this.column=1;break;case",":this.addToken(i.COMMA,",");break;case"+":this.addToken(i.PLUS_SYMBOL,"+");break;case"-":this.addToken(i.MINUS_SYMBOL,"-");break;case"*":this.addToken(i.STAR,"*");break;case"/":this.addToken(i.SLASH,"/");break;case"(":this.addToken(i.LEFT_PAREN,"(");break;case")":this.addToken(i.RIGHT_PAREN,")");break;case'"':this.string();break;default:if(this.isDigit(e))this.number();else if(this.isAlpha(e))this.identifier();else throw new E(`I don't recognize the character '${e}'`,this.line,this.column-1)}}string(){const e=this.line,t=this.column-1;for(;this.peek()!=='"'&&!this.isAtEnd();)this.peek()===`
`&&(this.line++,this.column=1),this.advance();if(this.isAtEnd())throw new E('I found a string that was never closed. Add a " at the end.',e,t);this.advance();const n=this.source.slice(this.start+1,this.current-1);this.addToken(i.STRING,n)}number(){for(;this.isDigit(this.peek());)this.advance();if(this.peek()==="."&&this.isDigit(this.peekNext()))for(this.advance();this.isDigit(this.peek());)this.advance();const e=this.source.slice(this.start,this.current);this.addToken(i.NUMBER,e)}identifier(){for(;this.isAlphaNumeric(this.peek());)this.advance();const e=this.source.slice(this.start,this.current).toLowerCase();if(e==="note"&&this.peek()===":"){for(this.advance();this.peek()!==`
`&&!this.isAtEnd();)this.advance();return}const t=L[e]??i.IDENTIFIER;this.addToken(t,e)}isAtEnd(){return this.current>=this.source.length}advance(){return this.column++,this.source[this.current++]}peek(){return this.isAtEnd()?"\0":this.source[this.current]}peekNext(){return this.current+1>=this.source.length?"\0":this.source[this.current+1]}isDigit(e){return e>="0"&&e<="9"}isAlpha(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"||e==="_"}isAlphaNumeric(e){return this.isAlpha(e)||this.isDigit(e)}addToken(e,t){this.tokens.push({type:e,value:t,line:this.line,column:this.column-t.length})}}function D(s){return new C(s).tokenize()}class O{constructor(e){this.current=0,this.tokens=e.filter(t=>t.type!==i.NEWLINE)}parse(){const e=[];for(;!this.isAtEnd();){const t=this.parseStatement();t&&e.push(t)}return{type:"Program",statements:e}}parseStatement(){for(;this.check(i.NEWLINE);)this.advance();if(this.isAtEnd())return null;if(this.check(i.SET))return this.parseSetStatement();if(this.check(i.IF))return this.parseIfStatement();if(this.check(i.REPEAT))return this.parseRepeatStatement();if(this.check(i.FOR))return this.parseForEachStatement();if(this.check(i.FUNCTION))return this.parseFunctionDeclaration();if(this.check(i.RETURN))return this.parseReturnStatement();if(this.check(i.PRINT))return this.parsePrintStatement();if(this.check(i.DRAW))return this.parseDrawStatement();if(this.check(i.CLEAR))return this.parseClearCanvasStatement();if(this.check(i.ASK))return this.parseAskStatement();if(this.check(i.IDENTIFIER)){const t=this.peekNext();return t&&t.type===i.WITH?this.parseFunctionCallStatement():this.parseFunctionCallStatement()}const e=this.peek();throw new p(`I don't know how to handle '${e.value}' here`,e.line,e.column,"Statements usually start with: set, if, repeat, for, function, print, or draw")}parseSetStatement(){const e=this.consume(i.SET,"Expected 'set'");if(this.check(i.COLOR))return this.advance(),this.consume(i.TO,"Expected 'to' after 'set color'"),{type:"SetColorStatement",color:this.parseExpression(),line:e.line};if(this.check(i.ITEM)){this.advance();const r=this.parseSimpleExpression();this.consume(i.OF,"Expected 'of' after item index");const a=this.consume(i.IDENTIFIER,"Expected list name after 'of'");this.consume(i.TO,"Expected 'to' after list name");const o=this.parseExpression();return{type:"SetItemStatement",index:r,list:a.value,value:o,line:e.line}}const t=this.consume(i.IDENTIFIER,"Expected a variable name after 'set'");this.consume(i.TO,`Expected 'to' after 'set ${t.value}'`);const n=this.parseExpression();return{type:"SetStatement",identifier:t.value,value:n,line:e.line}}parseIfStatement(){const e=this.consume(i.IF,"Expected 'if'"),t=this.parseExpression();this.consume(i.THEN,"Expected 'then' after the condition");const n=[];for(;!this.check(i.END)&&!this.check(i.ELSE)&&!this.isAtEnd();){const a=this.parseStatement();a&&n.push(a)}let r=null;if(this.check(i.ELSE)){if(this.advance(),this.check(i.IF))return r=[this.parseIfStatement()],{type:"IfStatement",condition:t,thenBranch:n,elseBranch:r,line:e.line};for(r=[];!this.check(i.END)&&!this.isAtEnd();){const a=this.parseStatement();a&&r.push(a)}}return this.consume(i.END,"Expected 'end' to close the if statement"),this.consume(i.IF,"Expected 'if' after 'end' (write 'end if')"),{type:"IfStatement",condition:t,thenBranch:n,elseBranch:r,line:e.line}}parseRepeatStatement(){const e=this.consume(i.REPEAT,"Expected 'repeat'");if(this.check(i.WHILE)){this.advance();const r=this.parseExpression(),a=[];for(;!this.check(i.END)&&!this.isAtEnd();){const o=this.parseStatement();o&&a.push(o)}return this.consume(i.END,"Expected 'end' to close the repeat loop"),this.consume(i.REPEAT,"Expected 'repeat' after 'end' (write 'end repeat')"),{type:"RepeatWhileStatement",condition:r,body:a,line:e.line}}const t=this.parseValueExpression();this.consume(i.TIMES,"Expected 'times' after the number");const n=[];for(;!this.check(i.END)&&!this.isAtEnd();){const r=this.parseStatement();r&&n.push(r)}return this.consume(i.END,"Expected 'end' to close the repeat loop"),this.consume(i.REPEAT,"Expected 'repeat' after 'end' (write 'end repeat')"),{type:"RepeatTimesStatement",count:t,body:n,line:e.line}}parseForEachStatement(){const e=this.consume(i.FOR,"Expected 'for'");this.consume(i.EACH,"Expected 'each' after 'for'");const t=this.consume(i.IDENTIFIER,"Expected a variable name after 'for each'");this.consume(i.IN,`Expected 'in' after 'for each ${t.value}'`);const n=this.parseExpression();this.consume(i.DO,"Expected 'do' before the loop body");const r=[];for(;!this.check(i.END)&&!this.isAtEnd();){const a=this.parseStatement();a&&r.push(a)}return this.consume(i.END,"Expected 'end' to close the for loop"),this.consume(i.FOR,"Expected 'for' after 'end' (write 'end for')"),{type:"ForEachStatement",variable:t.value,iterable:n,body:r,line:e.line}}parseFunctionDeclaration(){const e=this.consume(i.FUNCTION,"Expected 'function'"),t=this.consume(i.IDENTIFIER,"Expected a function name after 'function'"),n=[];if(this.check(i.TAKING))for(this.advance();this.check(i.IDENTIFIER);)n.push(this.advance().value),this.check(i.COMMA)&&this.advance(),this.check(i.AND)&&this.advance();const r=[];for(;!this.check(i.END)&&!this.isAtEnd();){const a=this.parseStatement();a&&r.push(a)}return this.consume(i.END,"Expected 'end' to close the function"),this.consume(i.FUNCTION,"Expected 'function' after 'end' (write 'end function')"),{type:"FunctionDeclaration",name:t.value,parameters:n,body:r,line:e.line}}parseFunctionCallStatement(){const e=this.parseFunctionCallExpression();return{type:"FunctionCallStatement",call:e,line:e.arguments.length>0?this.previous().line:this.peek().line}}parseFunctionCallExpression(){const e=this.consume(i.IDENTIFIER,"Expected function name"),t=[];if(this.check(i.WITH))for(this.advance(),t.push(this.parseSimpleExpression());this.check(i.COMMA)||this.check(i.AND);)this.advance(),t.push(this.parseSimpleExpression());return{type:"FunctionCallExpression",name:e.value,arguments:t}}parseReturnStatement(){const e=this.consume(i.RETURN,"Expected 'return'");let t=null;return!this.checkStatementStart()&&!this.check(i.END)&&(t=this.parseExpression()),{type:"ReturnStatement",value:t,line:e.line}}parsePrintStatement(){const e=this.consume(i.PRINT,"Expected 'print'");return{type:"PrintStatement",value:this.parseExpression(),line:e.line}}parseDrawStatement(){const e=this.consume(i.DRAW,"Expected 'draw'"),t={};if(this.check(i.CIRCLE))return this.advance(),this.consume(i.AT,"Expected 'at' after 'draw circle'"),t.x=this.parseBasicValue(),this.consumeOptionalComma(),t.y=this.parseBasicValue(),this.consume(i.WITH,"Expected 'with' before radius"),this.consume(i.RADIUS,"Expected 'radius'"),t.radius=this.parseBasicValue(),{type:"DrawStatement",shape:"circle",params:t,line:e.line};if(this.check(i.RECTANGLE))return this.advance(),this.consume(i.AT,"Expected 'at' after 'draw rectangle'"),t.x=this.parseBasicValue(),this.consumeOptionalComma(),t.y=this.parseBasicValue(),this.consume(i.WITH,"Expected 'with' before dimensions"),this.consume(i.WIDTH,"Expected 'width'"),t.width=this.parseBasicValue(),this.check(i.AND)&&this.advance(),this.consume(i.HEIGHT,"Expected 'height'"),t.height=this.parseBasicValue(),{type:"DrawStatement",shape:"rectangle",params:t,line:e.line};if(this.check(i.LINE))return this.advance(),this.consume(i.FROM,"Expected 'from' after 'draw line'"),t.x1=this.parseBasicValue(),this.consumeOptionalComma(),t.y1=this.parseBasicValue(),this.consume(i.TO,"Expected 'to' in 'draw line from x1, y1 to x2, y2'"),t.x2=this.parseBasicValue(),this.consumeOptionalComma(),t.y2=this.parseBasicValue(),{type:"DrawStatement",shape:"line",params:t,line:e.line};throw new p("Expected 'circle', 'rectangle', or 'line' after 'draw'",e.line,e.column)}parseClearCanvasStatement(){const e=this.consume(i.CLEAR,"Expected 'clear'");return this.consume(i.CANVAS,"Expected 'canvas' after 'clear'"),{type:"ClearCanvasStatement",line:e.line}}parseAskStatement(){const e=this.consume(i.ASK,"Expected 'ask'"),t=this.parseExpression();this.consume(i.AND,"Expected 'and' after the prompt"),this.consume(i.STORE,"Expected 'store' after 'and'"),this.consume(i.IN,"Expected 'in' after 'store'");const n=this.consume(i.IDENTIFIER,"Expected variable name after 'in'");return{type:"AskStatement",prompt:t,variable:n.value,line:e.line}}parseExpression(){return this.parseOr()}parseSimpleExpression(){return this.parseComparison()}parseValueExpression(){return this.parsePrimary()}parseBasicValue(){return this.parseAdditiveNoFunctionCall()}parseAdditiveNoFunctionCall(){let e=this.parseMultiplicativeNoFunctionCall();for(;;){let t=null;if(this.check(i.PLUS)||this.check(i.PLUS_SYMBOL)?(this.advance(),t="plus"):(this.check(i.MINUS)||this.check(i.MINUS_SYMBOL))&&(this.advance(),t="minus"),t){const n=this.parseMultiplicativeNoFunctionCall();e={type:"BinaryExpression",operator:t,left:e,right:n}}else break}return e}parseMultiplicativeNoFunctionCall(){let e=this.parsePrimaryNoFunctionCall();for(;;){let t=null;if(this.check(i.TIMES_OP)||this.check(i.STAR)||this.check(i.TIMES)?(this.advance(),t="times"):this.check(i.DIVIDED)?(this.advance(),this.consume(i.BY,"Expected 'by' after 'divided'"),t="divided by"):this.check(i.SLASH)?(this.advance(),t="divided by"):this.check(i.MOD)&&(this.advance(),t="mod"),t){const n=this.parsePrimaryNoFunctionCall();e={type:"BinaryExpression",operator:t,left:e,right:n}}else break}return e}parsePrimaryNoFunctionCall(){if(this.check(i.NUMBER)){const e=this.advance();return{type:"NumberLiteral",value:parseFloat(e.value)}}if(this.check(i.IDENTIFIER))return{type:"Identifier",name:this.advance().value};if(this.check(i.MINUS_SYMBOL))return this.advance(),{type:"UnaryExpression",operator:"minus",operand:this.parsePrimaryNoFunctionCall()};throw new p("Expected a number or variable here",this.peek().line,this.peek().column)}parseOr(){let e=this.parseAnd();for(;this.check(i.OR);){this.advance();const t=this.parseAnd();e={type:"BinaryExpression",operator:"or",left:e,right:t}}return e}parseAnd(){let e=this.parseComparison();for(;this.check(i.AND);){this.advance();const t=this.parseComparison();e={type:"BinaryExpression",operator:"and",left:e,right:t}}return e}parseComparison(){let e=this.parseJoined();if(this.check(i.IS)){this.advance();let t;if(this.check(i.EQUAL))this.advance(),this.consume(i.TO,"Expected 'to' after 'is equal'"),t="equal to";else if(this.check(i.GREATER))this.advance(),this.consume(i.THAN,"Expected 'than' after 'is greater'"),this.check(i.OR)?(this.advance(),this.consume(i.EQUAL,"Expected 'equal' after 'or'"),this.consume(i.TO,"Expected 'to' after 'equal'"),t="greater than or equal to"):t="greater than";else if(this.check(i.LESS))this.advance(),this.consume(i.THAN,"Expected 'than' after 'is less'"),this.check(i.OR)?(this.advance(),this.consume(i.EQUAL,"Expected 'equal' after 'or'"),this.consume(i.TO,"Expected 'to' after 'equal'"),t="less than or equal to"):t="less than";else if(this.check(i.NOT))this.advance(),this.consume(i.EQUAL,"Expected 'equal' after 'is not'"),this.consume(i.TO,"Expected 'to' after 'equal'"),t="not equal to";else{if(this.check(i.YES))return{type:"ComparisonExpression",operator:"equal to",left:e,right:{type:"BooleanLiteral",value:!0}};if(this.check(i.NO))return{type:"ComparisonExpression",operator:"equal to",left:e,right:{type:"BooleanLiteral",value:!1}};throw new p("Expected 'equal to', 'greater than', 'less than', or 'not equal to' after 'is'",this.peek().line,this.peek().column)}const n=this.parseJoined();return{type:"ComparisonExpression",operator:t,left:e,right:n}}return e}parseJoined(){let e=this.parseAdditive();for(;this.check(i.JOINED);){this.advance(),this.consume(i.WITH,"Expected 'with' after 'joined'");const t=this.parseAdditive();e={type:"JoinedExpression",left:e,right:t}}return e}parseAdditive(){let e=this.parseMultiplicative();for(;;){let t=null;if(this.check(i.PLUS)||this.check(i.PLUS_SYMBOL)?(this.advance(),t="plus"):(this.check(i.MINUS)||this.check(i.MINUS_SYMBOL))&&(this.advance(),t="minus"),t){const n=this.parseMultiplicative();e={type:"BinaryExpression",operator:t,left:e,right:n}}else break}return e}parseMultiplicative(){let e=this.parseUnary();for(;;){let t=null;if(this.check(i.TIMES_OP)||this.check(i.STAR)?(this.advance(),t="times"):this.check(i.TIMES)?(this.advance(),t="times"):this.check(i.DIVIDED)?(this.advance(),this.consume(i.BY,"Expected 'by' after 'divided'"),t="divided by"):this.check(i.SLASH)?(this.advance(),t="divided by"):this.check(i.MOD)&&(this.advance(),t="mod"),t){const n=this.parseUnary();e={type:"BinaryExpression",operator:t,left:e,right:n}}else break}return e}parseUnary(){return this.check(i.NOT)?(this.advance(),{type:"UnaryExpression",operator:"not",operand:this.parseUnary()}):this.check(i.MINUS_SYMBOL)?(this.advance(),{type:"UnaryExpression",operator:"minus",operand:this.parseUnary()}):this.parsePrimary()}parsePrimary(){if(this.check(i.LEFT_PAREN)){this.advance();const t=this.parseExpression();return this.consume(i.RIGHT_PAREN,"Expected ')' after expression"),{type:"GroupedExpression",expression:t}}if(this.check(i.NUMBER)){const t=this.advance();return{type:"NumberLiteral",value:parseFloat(t.value)}}if(this.check(i.STRING))return{type:"StringLiteral",value:this.advance().value};if(this.check(i.YES))return this.advance(),{type:"BooleanLiteral",value:!0};if(this.check(i.NO))return this.advance(),{type:"BooleanLiteral",value:!1};if(this.check(i.LENGTH))return this.advance(),this.consume(i.OF,"Expected 'of' after 'length'"),{type:"LengthExpression",list:this.parseExpression()};if(this.check(i.RANDOM)){this.advance(),this.consume(i.NUMBER_KW,"Expected 'number' after 'random'"),this.consume(i.FROM,"Expected 'from' after 'random number'");const t=this.parseSimpleExpression();this.consume(i.TO,"Expected 'to' in 'random number from X to Y'");const n=this.parseSimpleExpression();return{type:"RandomExpression",min:t,max:n}}if(this.check(i.LIST)){this.advance(),this.consume(i.OF,"Expected 'of' after 'list'");const t=[];for(t.push(this.parseSimpleExpression());this.check(i.COMMA)||this.check(i.AND);)this.advance(),t.push(this.parseSimpleExpression());return{type:"ListLiteral",elements:t}}if(this.check(i.ITEM)){this.advance();const t=this.parseExpression();this.consume(i.OF,"Expected 'of' after item index");const n=this.parseExpression();return{type:"ItemAccess",index:t,list:n}}if(this.check(i.IDENTIFIER)){const t=this.advance();return this.check(i.WITH)?(this.current--,this.parseFunctionCallExpression()):{type:"Identifier",name:t.value}}const e=this.peek();throw new p(`I expected a value here but found '${e.value}'`,e.line,e.column)}check(e){return this.isAtEnd()?!1:this.peek().type===e}checkStatementStart(){return this.check(i.SET)||this.check(i.IF)||this.check(i.REPEAT)||this.check(i.FOR)||this.check(i.FUNCTION)||this.check(i.RETURN)||this.check(i.PRINT)||this.check(i.DRAW)||this.check(i.CLEAR)}advance(){return this.isAtEnd()||this.current++,this.previous()}isAtEnd(){return this.peek().type===i.EOF}peek(){return this.tokens[this.current]}peekNext(){return this.current+1>=this.tokens.length?null:this.tokens[this.current+1]}previous(){return this.tokens[this.current-1]}consume(e,t){if(this.check(e))return this.advance();const n=this.peek(),r=A(n.value,[e.toLowerCase()]),a=r?`Did you mean '${r}'?`:void 0;throw new p(t,n.line,n.column,a)}consumeOptionalComma(){this.check(i.COMMA)&&this.advance()}}function F(s){return new O(s).parse()}class y{constructor(e){this.value=e}}class M{constructor(e){this.globals=new Map,this.environment=this.globals,this.callbacks=e}run(e){for(const t of e.statements)this.executeStatement(t)}executeStatement(e){switch(e.type){case"SetStatement":this.executeSetStatement(e);break;case"SetItemStatement":this.executeSetItemStatement(e);break;case"IfStatement":this.executeIfStatement(e);break;case"RepeatTimesStatement":this.executeRepeatTimesStatement(e);break;case"RepeatWhileStatement":this.executeRepeatWhileStatement(e);break;case"ForEachStatement":this.executeForEachStatement(e);break;case"FunctionDeclaration":this.executeFunctionDeclaration(e);break;case"FunctionCallStatement":this.evaluateFunctionCall(e.call);break;case"ReturnStatement":this.executeReturnStatement(e);break;case"PrintStatement":this.executePrintStatement(e);break;case"DrawStatement":this.executeDrawStatement(e);break;case"SetColorStatement":this.executeSetColorStatement(e);break;case"ClearCanvasStatement":this.callbacks.clearCanvas();break;case"AskStatement":this.executeAskStatement(e);break;default:throw new h(`Unknown statement type: ${e.type}`,0)}}executeSetStatement(e){const t=this.evaluate(e.value);this.environment.set(e.identifier,t)}executeSetItemStatement(e){const t=this.evaluate(e.index),n=this.evaluate(e.value),r=this.lookupVariable(e.list);if(typeof t!="number")throw new h(`The item number needs to be a number, but got ${typeof t}`,e.line);if(!Array.isArray(r))throw new h(`'${e.list}' is not a list`,e.line);const a=Math.floor(t)-1;if(a<0||a>=r.length)throw new h(`There is no item ${t} in this list. The list has ${r.length} item(s).`,e.line,1,`Valid item numbers are 1 to ${r.length}`);r[a]=n}executeAskStatement(e){const t=this.stringify(this.evaluate(e.prompt)),n=window.prompt(t)??"";this.environment.set(e.variable,n)}executeIfStatement(e){const t=this.evaluate(e.condition);if(this.isTruthy(t))for(const n of e.thenBranch)this.executeStatement(n);else if(e.elseBranch)for(const n of e.elseBranch)this.executeStatement(n)}executeRepeatTimesStatement(e){const t=this.evaluate(e.count);if(typeof t!="number")throw new h(`'repeat' needs a number, but got ${typeof t}`,e.line);for(let n=0;n<t;n++)for(const r of e.body)this.executeStatement(r)}executeRepeatWhileStatement(e){let t=0;const n=1e5;for(;this.isTruthy(this.evaluate(e.condition));){for(const r of e.body)this.executeStatement(r);if(t++,t>n)throw new h("This loop has run too many times. There might be an infinite loop.",e.line,1,"Check that your loop condition will eventually become false")}}executeForEachStatement(e){const t=this.evaluate(e.iterable);if(!Array.isArray(t))throw new h(`'for each' needs a list to loop over, but got ${typeof t}`,e.line);for(const n of t){this.environment.set(e.variable,n);for(const r of e.body)this.executeStatement(r)}}executeFunctionDeclaration(e){const t={type:"function",name:e.name,parameters:e.parameters,body:e.body};this.globals.set(e.name,t)}executeReturnStatement(e){const t=e.value?this.evaluate(e.value):null;throw new y(t)}executePrintStatement(e){const t=this.evaluate(e.value);this.callbacks.print(this.stringify(t))}executeDrawStatement(e){const t=e.params;switch(e.shape){case"circle":{const n=this.evaluateNumber(t.x,"x",e.line),r=this.evaluateNumber(t.y,"y",e.line),a=this.evaluateNumber(t.radius,"radius",e.line);this.callbacks.drawCircle(n,r,a);break}case"rectangle":{const n=this.evaluateNumber(t.x,"x",e.line),r=this.evaluateNumber(t.y,"y",e.line),a=this.evaluateNumber(t.width,"width",e.line),o=this.evaluateNumber(t.height,"height",e.line);this.callbacks.drawRectangle(n,r,a,o);break}case"line":{const n=this.evaluateNumber(t.x1,"x1",e.line),r=this.evaluateNumber(t.y1,"y1",e.line),a=this.evaluateNumber(t.x2,"x2",e.line),o=this.evaluateNumber(t.y2,"y2",e.line);this.callbacks.drawLine(n,r,a,o);break}}}executeSetColorStatement(e){const t=this.evaluate(e.color);this.callbacks.setColor(String(t))}evaluate(e){switch(e.type){case"NumberLiteral":return e.value;case"StringLiteral":return e.value;case"BooleanLiteral":return e.value;case"Identifier":return this.lookupVariable(e.name);case"ListLiteral":return e.elements.map(t=>this.evaluate(t));case"ItemAccess":return this.evaluateItemAccess(e);case"BinaryExpression":return this.evaluateBinaryExpression(e);case"UnaryExpression":return this.evaluateUnaryExpression(e);case"ComparisonExpression":return this.evaluateComparisonExpression(e);case"JoinedExpression":return this.evaluateJoinedExpression(e);case"FunctionCallExpression":return this.evaluateFunctionCall(e);case"LengthExpression":return this.evaluateLengthExpression(e);case"RandomExpression":return this.evaluateRandomExpression(e);case"GroupedExpression":return this.evaluate(e.expression);default:throw new h(`Unknown expression type: ${e.type}`,0)}}lookupVariable(e){if(this.environment.has(e))return this.environment.get(e);if(this.globals.has(e))return this.globals.get(e);throw new h(`I don't know what '${e}' is. Did you forget to set it first?`,0,1,`Try adding: set ${e} to ...`)}evaluateItemAccess(e){const t=this.evaluate(e.index),n=this.evaluate(e.list);if(typeof t!="number")throw new h(`The item number needs to be a number, but got ${typeof t}`,0);if(!Array.isArray(n))throw new h(`'item' can only be used with lists, but got ${typeof n}`,0);const r=Math.floor(t)-1;if(r<0||r>=n.length)throw new h(`There is no item ${t} in this list. The list has ${n.length} item(s).`,0,1,`Valid item numbers are 1 to ${n.length}`);return n[r]}evaluateBinaryExpression(e){const t=this.evaluate(e.left),n=this.evaluate(e.right);switch(e.operator){case"plus":if(typeof t=="number"&&typeof n=="number")return t+n;throw new h(`Cannot add ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);case"minus":if(typeof t=="number"&&typeof n=="number")return t-n;throw new h(`Cannot subtract ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);case"times":if(typeof t=="number"&&typeof n=="number")return t*n;throw new h(`Cannot multiply ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);case"divided by":if(typeof t=="number"&&typeof n=="number"){if(n===0)throw new h("Cannot divide by zero",0,1,"Division by zero is undefined in mathematics");return t/n}throw new h(`Cannot divide ${typeof t} by ${typeof n}. Both sides need to be numbers.`,0);case"mod":if(typeof t=="number"&&typeof n=="number")return t%n;throw new h(`Cannot use 'mod' with ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);case"and":return this.isTruthy(t)&&this.isTruthy(n);case"or":return this.isTruthy(t)||this.isTruthy(n);default:throw new h(`Unknown operator: ${e.operator}`,0)}}evaluateUnaryExpression(e){const t=this.evaluate(e.operand);switch(e.operator){case"not":return!this.isTruthy(t);case"minus":if(typeof t=="number")return-t;throw new h(`Cannot negate ${typeof t}. Expected a number.`,0);default:throw new h(`Unknown operator: ${e.operator}`,0)}}evaluateComparisonExpression(e){const t=this.evaluate(e.left),n=this.evaluate(e.right);switch(e.operator){case"equal to":return this.isEqual(t,n);case"not equal to":return!this.isEqual(t,n);case"greater than":if(typeof t=="number"&&typeof n=="number")return t>n;throw new h(`Cannot compare ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);case"less than":if(typeof t=="number"&&typeof n=="number")return t<n;throw new h(`Cannot compare ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);case"greater than or equal to":if(typeof t=="number"&&typeof n=="number")return t>=n;throw new h(`Cannot compare ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);case"less than or equal to":if(typeof t=="number"&&typeof n=="number")return t<=n;throw new h(`Cannot compare ${typeof t} and ${typeof n}. Both sides need to be numbers.`,0);default:throw new h(`Unknown comparison: ${e.operator}`,0)}}evaluateJoinedExpression(e){const t=this.evaluate(e.left),n=this.evaluate(e.right);return this.stringify(t)+this.stringify(n)}evaluateLengthExpression(e){const t=this.evaluate(e.list);if(typeof t=="string")return t.length;if(!Array.isArray(t))throw new h(`'length of' needs a list or text, but got ${typeof t}`,0);return t.length}evaluateRandomExpression(e){const t=this.evaluate(e.min),n=this.evaluate(e.max);if(typeof t!="number"||typeof n!="number")throw new h(`'random number from' needs two numbers, but got ${typeof t} and ${typeof n}`,0);return Math.floor(Math.random()*(n-t+1))+t}evaluateFunctionCall(e){const t=this.lookupVariable(e.name);if(!t||typeof t!="object"||t.type!=="function")throw new h(`'${e.name}' is not a function`,0,1,`Make sure you defined a function called '${e.name}'`);const n=t,r=e.arguments.map(c=>this.evaluate(c));if(r.length!==n.parameters.length)throw new h(`The function '${e.name}' needs ${n.parameters.length} value(s), but you gave it ${r.length}`,0);const a=this.environment;this.environment=new Map(this.globals);for(let c=0;c<n.parameters.length;c++)this.environment.set(n.parameters[c],r[c]);let o=null;try{for(const c of n.body)this.executeStatement(c)}catch(c){if(c instanceof y)o=c.value;else throw c}return this.environment=a,o}evaluateNumber(e,t,n){const r=this.evaluate(e);if(typeof r!="number")throw new h(`'${t}' needs to be a number, but got ${typeof r}`,n);return r}isTruthy(e){return e===null?!1:typeof e=="boolean"?e:!0}isEqual(e,t){return e===null&&t===null?!0:e===null||t===null?!1:Array.isArray(e)&&Array.isArray(t)?e.length!==t.length?!1:e.every((n,r)=>this.isEqual(n,t[r])):e===t}stringify(e){return e===null?"nothing":typeof e=="boolean"?e?"yes":"no":Array.isArray(e)?"list of "+e.map(t=>this.stringify(t)).join(", "):typeof e=="object"&&e.type==="function"?`function ${e.name}`:String(e)}}function T(s){return new M(s)}function B(s,e){const t=s.getContext("2d");let n="black";return{print(r){const a=document.createElement("div");a.textContent=r,e.appendChild(a),e.scrollTop=e.scrollHeight},drawCircle(r,a,o){t.beginPath(),t.arc(r,a,o,0,Math.PI*2),t.fillStyle=n,t.fill()},drawRectangle(r,a,o,c){t.fillStyle=n,t.fillRect(r,a,o,c)},drawLine(r,a,o,c){t.beginPath(),t.moveTo(r,a),t.lineTo(o,c),t.strokeStyle=n,t.lineWidth=2,t.stroke()},setColor(r){n=r},clearCanvas(){t.clearRect(0,0,s.width,s.height)},async ask(r){return window.prompt(r)??""}}}function U(s,e){try{const t=D(s),n=F(t);return T(e).run(n),{success:!0}}catch(t){if(t instanceof E)return{success:!1,error:{message:t.message,line:t.line,column:t.column,formatted:t.format(s)}};throw t}}const $=["set","to","if","then","else","end","function","taking","with","repeat","times","while","for","each","in","do","return","and","or","not","is","equal","greater","less","than","plus","minus","divided","by","mod","joined","list","of","item","length","random","number","from","ask","store"],P=["print","draw","circle","rectangle","line","at","radius","width","height","color","clear","canvas"],H=["yes","no"];function u(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function j(s){return s.split(`
`).map(n=>{const r=n.match(/^(\s*)(note:)(.*)$/i);if(r){const[,c,l,m]=r;return`${u(c)}<span class="hl-comment">${u(l)}${u(m)}</span>`}let a="",o=0;for(;o<n.length;){if(n[o]==='"'){let c=o+1;for(;c<n.length&&n[c]!=='"';)c++;const l=n.slice(o,c+1);a+=`<span class="hl-string">${u(l)}</span>`,o=c+1;continue}if(/\d/.test(n[o])){let c=o;for(;c<n.length&&/[\d.]/.test(n[c]);)c++;const l=n.slice(o,c);a+=`<span class="hl-number">${u(l)}</span>`,o=c;continue}if(/[a-zA-Z_]/.test(n[o])){let c=o;for(;c<n.length&&/[a-zA-Z0-9_]/.test(n[c]);)c++;const l=n.slice(o,c),m=l.toLowerCase();H.includes(m)?a+=`<span class="hl-boolean">${u(l)}</span>`:$.includes(m)?a+=`<span class="hl-keyword">${u(l)}</span>`:P.includes(m)?a+=`<span class="hl-builtin">${u(l)}</span>`:a+=u(l),o=c;continue}a+=u(n[o]),o++}return a}).join(`
`)}const b={hello:`note: Welcome to Gently!
note: This is a simple Hello World program

print "Hello, World!"
print "Welcome to Gently programming language"

set name to "Friend"
print "Nice to meet you, " joined with name`,math:`note: Basic math operations in Gently

set a to 10
set b to 3

print "Math with " joined with a joined with " and " joined with b

set sum to a plus b
print "Sum: " joined with sum

set difference to a minus b
print "Difference: " joined with difference

set product to a times b
print "Product: " joined with product

set quotient to a divided by b
print "Quotient: " joined with quotient

set remainder to a mod b
print "Remainder: " joined with remainder

note: You can also use symbols
set result to 5 + 3 * 2
print "5 + 3 * 2 = " joined with result`,loops:`note: Different types of loops in Gently

print "Counting to 5:"
set counter to 1
repeat 5 times
    print counter
    set counter to counter plus 1
end repeat

print ""
print "Using a list:"
set fruits to list of "apple", "banana", "cherry"
for each fruit in fruits do
    print "I like " joined with fruit
end for

print ""
print "Countdown:"
set n to 5
repeat while n is greater than 0
    print n
    set n to n minus 1
end repeat
print "Blast off!"`,drawing:`note: Drawing shapes on the canvas
note: Click the "Canvas" tab to see the output!

clear canvas

note: Draw a blue sky
set color to "lightblue"
draw rectangle at 0, 0 with width 400 and height 200

note: Draw the sun
set color to "yellow"
draw circle at 350, 50 with radius 40

note: Draw grass
set color to "green"
draw rectangle at 0, 200 with width 400 and height 100

note: Draw a house
set color to "brown"
draw rectangle at 150, 120 with width 100 and height 80

note: Draw a roof
set color to "darkred"
draw line from 140, 120 to 200, 70
draw line from 200, 70 to 260, 120

note: Draw a door
set color to "saddlebrown"
draw rectangle at 185, 150 with width 30 and height 50

print "Drew a house scene!"
print "Click the Canvas tab to see it."`,function:`note: Functions in Gently

note: A simple greeting function
function greet taking name
    print "Hello, " joined with name joined with "!"
end function

greet with "Alice"
greet with "Bob"

note: A function that returns a value
function add taking a b
    return a plus b
end function

set result to add with 5 and 3
print "5 + 3 = " joined with result

note: A function to check if a number is even
function is_even taking number
    set remainder to number mod 2
    if remainder is equal to 0 then
        return yes
    end if
    return no
end function

set num to 4
if is_even with num then
    print num joined with " is even"
else
    print num joined with " is odd"
end if`,fibonacci:`note: Fibonacci sequence
note: Tests: recursion, functions returning values, conditionals

function fib taking n
    if n is less than or equal to 1 then
        return n
    end if
    set a to fib with n minus 1
    set b to fib with n minus 2
    return a plus b
end function

print "Fibonacci sequence:"
set i to 0
repeat 10 times
    set result to fib with i
    print "fib(" joined with i joined with ") = " joined with result
    set i to i plus 1
end repeat`,fizzbuzz:`note: FizzBuzz
note: Tests: modulo, conditionals, loops, nested logic

print "FizzBuzz from 1 to 20:"
print ""

set n to 1
repeat 20 times
    set by3 to n mod 3
    set by5 to n mod 5

    if by3 is equal to 0 and by5 is equal to 0 then
        print "FizzBuzz"
    else if by3 is equal to 0 then
        print "Fizz"
    else if by5 is equal to 0 then
        print "Buzz"
    else
        print n
    end if

    set n to n plus 1
end repeat`,factorial:`note: Factorial calculator
note: Tests: recursion, multiplication, base cases

function factorial taking n
    if n is less than or equal to 1 then
        return 1
    end if
    set prev to factorial with n minus 1
    return n times prev
end function

print "Factorials:"
set i to 0
repeat 8 times
    set result to factorial with i
    print i joined with "! = " joined with result
    set i to i plus 1
end repeat`,lists:`note: List operations
note: Tests: lists, for-each, item access, list length

set numbers to list of 10, 25, 5, 30, 15

note: Print all items
print "Numbers in list:"
for each num in numbers do
    print num
end for

note: Calculate sum
print ""
print "Calculating sum..."
set total to 0
for each num in numbers do
    set total to total plus num
end for
print "Sum: " joined with total

note: Find the largest
print ""
print "Finding largest..."
set largest to item 1 of numbers
for each num in numbers do
    if num is greater than largest then
        set largest to num
    end if
end for
print "Largest: " joined with largest

note: Find the smallest
print ""
print "Finding smallest..."
set smallest to item 1 of numbers
for each num in numbers do
    if num is less than smallest then
        set smallest to num
    end if
end for
print "Smallest: " joined with smallest`,primes:`note: Prime number checker
note: Tests: nested logic, early returns, modulo

function is_prime taking n
    if n is less than 2 then
        return no
    end if
    if n is equal to 2 then
        return yes
    end if
    if n mod 2 is equal to 0 then
        return no
    end if

    note: Check odd divisors up to square root approximation
    set divisor to 3
    repeat while divisor times divisor is less than or equal to n
        if n mod divisor is equal to 0 then
            return no
        end if
        set divisor to divisor plus 2
    end repeat

    return yes
end function

print "Prime numbers from 1 to 30:"
set n to 1
repeat 30 times
    if is_prime with n then
        print n joined with " is prime"
    end if
    set n to n plus 1
end repeat`,temperature:`note: Temperature converter
note: Tests: functions with calculations, decimal numbers

function celsius_to_fahrenheit taking c
    return c times 9 divided by 5 plus 32
end function

function fahrenheit_to_celsius taking f
    note: Need to subtract first, then multiply
    set adjusted to f minus 32
    return adjusted times 5 divided by 9
end function

print "Temperature Conversions:"
print ""

set temps to list of 0, 20, 37, 100

print "Celsius to Fahrenheit:"
for each c in temps do
    set f to celsius_to_fahrenheit with c
    print c joined with "C = " joined with f joined with "F"
end for

print ""
print "Fahrenheit to Celsius:"
set ftemps to list of 32, 68, 98.6, 212
for each f in ftemps do
    set c to fahrenheit_to_celsius with f
    print f joined with "F = " joined with c joined with "C"
end for`,multiplication:`note: Nested loops - multiplication table
note: Tests: nested repeat, string building

print "Multiplication Table (1-5):"
print ""

set row to 1
repeat 5 times
    set col to 1
    set row_text to ""
    repeat 5 times
        set product to row times col
        set row_text to row_text joined with product joined with "  "
        set col to col plus 1
    end repeat
    print row_text
    set row to row plus 1
end repeat`,patterns:`note: Drawing patterns
note: Tests: drawing commands, math in coordinates, loops with graphics

clear canvas

note: Draw a row of circles with different colors
set x to 30
set colors to list of "red", "orange", "yellow", "green", "blue", "purple"
set i to 1

repeat 6 times
    set clr to item i of colors
    set color to clr
    draw circle at x, 50 with radius 20
    set x to x plus 60
    set i to i plus 1
end repeat

note: Draw a grid of rectangles
set y to 100
set color to "gray"
repeat 4 times
    set x to 20
    repeat 6 times
        draw rectangle at x, y with width 50 and height 40
        set x to x plus 60
    end repeat
    set y to y plus 50
end repeat

note: Draw diagonal lines
set color to "black"
set i to 0
repeat 8 times
    set startx to i times 50
    draw line from startx, 0 to 400, 300 minus startx
    set i to i plus 1
end repeat

print "Pattern complete! Click Canvas tab to see."`,newfeatures:`note: Test new language features

note: Test parentheses for grouping
set a to 2
set b to 3
set c to 4
set result1 to (a plus b) times c
set result2 to a plus (b times c)
print "2 + 3 then * 4 = " joined with result1
print "2 + (3 * 4) = " joined with result2

note: Test else if
set score to 75
if score is greater than 90 then
    print "Grade: A"
else if score is greater than 80 then
    print "Grade: B"
else if score is greater than 70 then
    print "Grade: C"
else
    print "Grade: D"
end if

note: Test length of list
set items to list of "apple", "banana", "cherry"
set count to length of items
print "List has " joined with count joined with " items"

note: Test set item of list
print "Original first item: " joined with item 1 of items
set item 1 of items to "avocado"
print "Changed first item: " joined with item 1 of items

note: Test random number
set dice1 to random number from 1 to 6
set dice2 to random number from 1 to 6
print "Dice roll: " joined with dice1 joined with " and " joined with dice2

note: Test length of string
set message to "Hello World"
set msgLen to length of message
print "String '" joined with message joined with "' has " joined with msgLen joined with " characters"`},d=document.getElementById("editor"),_=document.getElementById("highlight-code"),x=document.getElementById("highlight-layer"),I=document.getElementById("output"),w=document.getElementById("canvas"),W=document.getElementById("run-btn"),g=document.getElementById("examples"),v=document.getElementById("error"),q=document.getElementById("help-btn"),f=document.getElementById("guide-modal"),G=document.getElementById("close-modal"),N=document.querySelectorAll(".tab"),V=document.querySelectorAll(".panel");function S(){const s=d.value;_.innerHTML=j(s)+`
`}function z(){x.scrollTop=d.scrollTop,x.scrollLeft=d.scrollLeft}N.forEach(s=>{s.addEventListener("click",()=>{var t;const e=s.getAttribute("data-tab");N.forEach(n=>n.classList.remove("active")),V.forEach(n=>n.classList.remove("active")),s.classList.add("active"),(t=document.getElementById(`${e}-panel`))==null||t.classList.add("active")})});g.addEventListener("change",()=>{const s=g.value;s&&b[s]&&(d.value=b[s],g.value="",S())});d.addEventListener("input",S);d.addEventListener("scroll",z);q.addEventListener("click",()=>{f.classList.remove("hidden")});G.addEventListener("click",()=>{f.classList.add("hidden")});f.addEventListener("click",s=>{s.target===f&&f.classList.add("hidden")});function k(){I.innerHTML="",v.classList.add("hidden"),v.textContent="",w.getContext("2d").clearRect(0,0,w.width,w.height);const e=d.value;if(!e.trim())return;const t=B(w,I),n=U(e,t);!n.success&&n.error&&(v.textContent=n.error.formatted,v.classList.remove("hidden"))}W.addEventListener("click",k);d.addEventListener("keydown",s=>{(s.ctrlKey||s.metaKey)&&s.key==="Enter"&&(s.preventDefault(),k())});d.value=b.hello;S();
