from flask import Flask, request, jsonify
from langchain.prompts import PromptTemplate
from langchain_community.llms import CTransformers

app = Flask(__name__)

def getLLamaresponse(input_text, no_words, blog_style):
    llm = CTransformers(model='models/llama-2-7b-chat.ggmlv3.q8_0.bin',
                        model_type='llama',
                        config={'max_new_tokens': 256,
                                'temperature': 0.01})
    
    template = f"Write a blog for {blog_style} job profile for a topic {input_text} within {no_words} words."
    response = llm(template)
    return response

@app.route('/generate-blog', methods=['POST'])
def generate_blog():
    data = request.get_json()
    input_text = data['input_text']
    no_words = data['no_words']
    blog_style = data['blog_style']

    result = getLLamaresponse(input_text, no_words, blog_style)
    return jsonify(result=result)

if __name__ == '__main__':
    app.run(debug=True)
