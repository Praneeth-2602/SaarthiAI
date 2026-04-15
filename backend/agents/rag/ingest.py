from pathlib import Path
import os


ROOT_DIR = Path(__file__).resolve().parents[3]
KNOWLEDGE_DIR = ROOT_DIR / "knowledge"
CHROMA_PERSIST_DIR = Path(
    os.getenv("CHROMA_PERSIST_DIR", str(Path(__file__).resolve().parents[1] / "chroma_db"))
)


def build_knowledge_base() -> None:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_community.document_loaders import DirectoryLoader, TextLoader
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_community.vectorstores import Chroma

    loader = DirectoryLoader(str(KNOWLEDGE_DIR), glob="**/*.md", loader_cls=TextLoader)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_PERSIST_DIR),
    )
    vectorstore.persist()

    print(f"Ingested {len(chunks)} chunks into {CHROMA_PERSIST_DIR}")


if __name__ == "__main__":
    build_knowledge_base()
