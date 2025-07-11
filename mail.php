<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $mensagem = $_POST['mensagem'];

    $para = "linverfalhugo@gmail.com";  // seu e-mail onde deseja receber as mensagens
    $assunto = "Mensagem do Portfólio de $nome";

    $corpo = "Nome: $nome\n";
    $corpo .= "Email: $email\n\n";
    $corpo .= "Mensagem:\n$mensagem\n";

    $headers = "From: $nome <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    if (mail($para, $assunto, $corpo, $headers)) {
        echo "<script>alert('Mensagem enviada com sucesso!'); window.location.href='index.html#contato';</script>";
    } else {
        echo "<script>alert('Erro ao enviar mensagem. Tente novamente mais tarde.'); window.location.href='index.html#contato';</script>";
    }
}
?>
