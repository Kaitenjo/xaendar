import { Lexer } from "../lexer/lexer";
import { TokenType } from "../lexer/models/token-type.enum";
import { Parser } from "../parser/parser";

function compile(input: string): void {
  const tokens = new Lexer(input).tokenize();

  const mappedTokens = tokens.map(token => {
    const { type, ...rest } = token;
    const mappedToken: { type: string, parts?: string[] } = { ...rest, type: '' };

    switch (type) {
      case TokenType.TEXT:
        mappedToken.type = 'text'
        break;
      case TokenType.ATTRIBUTE:
        mappedToken.type = 'attribute' as any
        break;
      case TokenType.EVENT:
        mappedToken.type = 'event' as any;
        break;
      case TokenType.TAG_SELF_CLOSE:
        mappedToken.type = 'self-close' as any;
        break;
      case TokenType.TAG_OPEN_NAME:
        mappedToken.type = 'open-name' as any;
        break;
      case TokenType.TAG_CLOSE_NAME:
        mappedToken.type = 'close-name' as any
        break;
      case TokenType.INTERPOLATION_EXPRESSION:
        mappedToken.type = 'interpolation-expression' as any
        break;
      case TokenType.INTERPOLATION_LITERAL:
        mappedToken.type = 'interpolation-literal' as any
        break;
      case TokenType.TAG_OPEN_END:
        mappedToken.type = 'tag-close' as any
        break;
    }
    return mappedToken;
  });

  console.log(mappedTokens);

  const ast = new Parser(tokens).parse();
  console.log(ast);
}

const template = `
<sp$a£n@ asd@ciao test="ciao" @click="onClick()" @suck="myDick()"  test={var1 + var2} test={var} int={\`ciao \${var} ciao2\`} />
<sp$a£n@ asd@ciao test="ciao" @click="onClick()" @suck="myDick()" />
{var}
{\`ciao \${var} ciao2\`}
<div dick>
  Text
</ div>
`
compile(template);