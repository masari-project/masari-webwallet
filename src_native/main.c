#include <stdio.h>
#include <time.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>
#include <stdint.h>

//#include "cryptonight.h"

#include "crypto.h"
#include "crypto-ops.h"
#include "hash-ops.h"
//#include "hash.h"
#include "common/varint.h"

extern "C" {

bool generate_key_derivation(const unsigned char *key1, const unsigned char *key2, unsigned char *derivation) {
    ge_p3 point;
    ge_p2 point2;
    ge_p1p1 point3;
//    assert(sc_check(&key2) == 0);
    if (ge_frombytes_vartime(&point, key1) != 0) {
        return false;
    }

    ge_scalarmult(&point2, key2, &point);
    ge_mul8(&point3, &point2);
    ge_p1p1_to_p2(&point2, &point3);
    ge_tobytes(derivation, &point2);
    return true;
}

void hash_to_scalar(const void *data, size_t length, crypto::ec_scalar &res) {
    cn_fast_hash(data, length, reinterpret_cast<char *>(&res));
    sc_reduce32(reinterpret_cast<unsigned char *>(&res));
}

void derivation_to_scalar(const crypto::key_derivation &derivation, size_t output_index, crypto::ec_scalar &res) {
    struct {
        crypto::key_derivation derivation;
        char output_index[(sizeof(size_t) * 8 + 6) / 7];
    } buf;
    char *end = buf.output_index;
    buf.derivation = derivation;
    tools::write_varint(end, output_index);
    assert(end <= buf.output_index + sizeof buf.output_index);
    hash_to_scalar(&buf, end - reinterpret_cast<char *>(&buf), res);
}

bool derive_public_key(const crypto::key_derivation &derivation, size_t output_index,
                       const crypto::public_key &base, crypto::public_key &derived_key) {
    crypto::ec_scalar scalar;
    ge_p3 point1;
    ge_p3 point2;
    ge_cached point3;
    ge_p1p1 point4;
    ge_p2 point5;
    if (ge_frombytes_vartime(&point1, reinterpret_cast<const unsigned char *>(&base)) != 0) {
        return false;
    }
    derivation_to_scalar(derivation, output_index, scalar);
    ge_scalarmult_base(&point2, reinterpret_cast<const unsigned char *>(&scalar));
    ge_p3_to_cached(&point3, &point2);
    ge_add(&point4, &point1, &point3);
    ge_p1p1_to_p2(&point5, &point4);
    ge_tobytes(reinterpret_cast<unsigned char *>(&derived_key), &point5);

    return true;
}

int main(void) {
    return 0;
}

}