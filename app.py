from flask import Flask, render_template
from dotenv import load_dotenv
import os
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

#Get the environment variables
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG')
@app.route('/')
def index():
  #return 'hello world'
  return render_template('index.html')

if __name__ == '__main__':
  app.run()