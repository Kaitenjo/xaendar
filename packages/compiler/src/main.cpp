#include "antlr4-runtime.h"
#include "TemplateLexer.h"
#include "TemplateParser.h"

using namespace antlr4;

int main() {
    std::string input = "<h1>{label}</h1>";
    ANTLRInputStream inputStream(input);
    TemplateLexer lexer(&inputStream);
    CommonTokenStream tokens(&lexer);
    TemplateParser parser(&tokens);

    tree::ParseTree* tree = parser.template_(); // entrypoint parser

    std::cout << tree->toStringTree(&parser) << std::endl;

    return 0;
}
